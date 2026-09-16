#!/usr/bin/env python3
"""Run every keeper prompt against a Llama model and build a PDF report.

Uses only the Python standard library and any OpenAI-compatible chat endpoint.
The API key is read from LLAMA_API_KEY and is never written to disk.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
import textwrap
import time
import unicodedata
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_PROMPTS = ROOT / "proj1a-report" / "keeper-prompts.md"
DEFAULT_REPO = ROOT / "proj2"
DEFAULT_OUTPUT = ROOT / "proj1a-report" / "llama-results"
SKIP_DIRS = {".git", "node_modules", "coverage", "build", "dist"}
TEXT_SUFFIXES = {
    ".css", ".html", ".js", ".json", ".jsx", ".md", ".ts", ".tsx",
    ".txt", ".yaml", ".yml",
}


def parse_prompts(path: Path) -> list[tuple[str, str, str]]:
    text = path.read_text(encoding="utf-8")
    matches = list(re.finditer(r"^## (KP\d+) — (.+?)\n\n```\n(.*?)\n```", text, re.M | re.S))
    if not matches:
        raise ValueError(f"No keeper prompts found in {path}")
    return [(m.group(1), m.group(2).strip(), m.group(3)) for m in matches]


def repository_snapshot(repo: Path, max_chars: int, prompt_key: str) -> str:
    priorities = {
        "KP1": ("README.md", "package.json", "docker-compose.yml", "server/index.js", "client/src/App.tsx"),
        "KP2": ("package.json", "env.example", "LOCAL_SETUP.md", "firebase.js", "voice.js"),
        "KP3": ("LOCAL_SETUP.md", "firebase.js", "env.example", "server/index.js", "README.md"),
        "KP4": ("voice.js", "features/voice", "CartContext.tsx", "orders.js", "api.ts"),
        "KP5": ("test", "voice.js", "features/voice", "jest.config.js", "package.json"),
        "KP6": ("voice.js", "features/voice", "test", "jest.config.js", "package.json"),
        "KP7": ("voice.js", "features/voice", "test", "jest.config.js", "package.json"),
        "KP8": ("voice.js", "features/voice", "donations.js", "README.md", "API.md"),
    }.get(prompt_key, ())
    candidates: list[Path] = []
    for path in repo.rglob("*"):
        if not path.is_file() or any(part in SKIP_DIRS for part in path.parts):
            continue
        if path.suffix.lower() in TEXT_SUFFIXES or path.name in {"Dockerfile", ".env.example"}:
            candidates.append(path)

    def rank(path: Path) -> tuple[int, int, str]:
        rel = path.relative_to(repo).as_posix()
        matches = [i for i, term in enumerate(priorities) if term.lower() in rel.lower()]
        return (min(matches) if matches else len(priorities), len(rel), rel)

    chunks: list[str] = []
    used = 0
    tree = "REPOSITORY FILE LIST:\n" + "\n".join(
        path.relative_to(repo).as_posix() for path in sorted(candidates)
    ) + "\n"
    chunks.append(tree)
    used += len(tree)
    for path in sorted(candidates, key=rank):
        rel = path.relative_to(repo).as_posix()
        try:
            body = path.read_text(encoding="utf-8")
        except (UnicodeDecodeError, OSError):
            continue
        numbered = "\n".join(f"{i:4d}: {line}" for i, line in enumerate(body.splitlines(), 1))
        chunk = f"\n===== {rel} =====\n{numbered}\n"
        if used + len(chunk) > max_chars:
            remaining = max_chars - used
            if remaining > 100:
                chunks.append(chunk[:remaining] + "\n[REPOSITORY SNAPSHOT TRUNCATED]\n")
            break
        chunks.append(chunk)
        used += len(chunk)
    return "".join(chunks)


def call_llama(base_url: str, api_key: str, model: str, system: str, prompt: str,
               temperature: float, max_output_tokens: int, timeout: int, retries: int) -> str:
    payload = json.dumps({
        "model": model,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": prompt},
        ],
        "temperature": temperature,
        "max_tokens": max_output_tokens,
    }).encode("utf-8")
    request = urllib.request.Request(
        base_url.rstrip("/") + "/chat/completions",
        data=payload,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json",
            # Some API gateways reject Python urllib's default User-Agent with
            # Cloudflare error 1010 before the request reaches the model.
            "User-Agent": "keeper-prompts-runner/1.0",
        },
        method="POST",
    )
    for attempt in range(retries + 1):
        try:
            with urllib.request.urlopen(request, timeout=timeout) as response:
                data = json.load(response)
            return data["choices"][0]["message"]["content"].strip()
        except urllib.error.HTTPError as exc:
            detail = exc.read().decode("utf-8", errors="replace")[:1000]
            if exc.code not in {429, 500, 502, 503, 504} or attempt == retries:
                if exc.code == 403 and "1010" in detail:
                    raise RuntimeError(
                        "Groq's gateway rejected this HTTP client (403 / Cloudflare 1010). "
                        "Confirm that you are using the updated runner, then try another network "
                        "or disable any VPN/proxy that may alter the request."
                    ) from exc
                raise RuntimeError(f"API HTTP {exc.code}: {detail}") from exc
        except (urllib.error.URLError, TimeoutError) as exc:
            if attempt == retries:
                raise RuntimeError(f"API request failed: {exc}") from exc
        time.sleep(2 ** attempt)
    raise AssertionError("unreachable")


def available_models(base_url: str, api_key: str, timeout: int) -> list[str]:
    request = urllib.request.Request(
        base_url.rstrip("/") + "/models",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Accept": "application/json",
            "User-Agent": "keeper-prompts-runner/1.0",
        },
    )
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            data = json.load(response)
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")[:1000]
        raise RuntimeError(f"Could not list API models (HTTP {exc.code}): {detail}") from exc
    return sorted(item["id"] for item in data.get("data", []) if item.get("id"))


def choose_llama_model(models: list[str]) -> str:
    # Prompt Guard and similar safety classifiers contain "llama" in their IDs,
    # but they cannot generate answers to the keeper prompts.
    nongenerative_terms = ("guard", "moderation", "safety", "classifier", "embedding")
    llama = [
        model for model in models
        if "llama" in model.lower()
        and not any(term in model.lower() for term in nongenerative_terms)
    ]
    if not llama:
        shown = "\n  ".join(models) if models else "(none returned)"
        raise RuntimeError(
            "This API project exposes no generative Llama models (guard/moderation "
            "classifiers do not qualify). Enable a chat/instruct Llama model in the "
            "provider project's model permissions, or use a different project/key. "
            f"Models currently exposed:\n  {shown}"
        )
    preferences = ("70b", "versatile", "instant", "8b")
    return sorted(llama, key=lambda model: tuple(term not in model.lower() for term in preferences))[0]


def markdown_report(model: str, endpoint: str, prompts: list[tuple[str, str, str]],
                    results: dict[str, str]) -> str:
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    lines = [
        "# Keeper Prompts — Llama Results", "",
        f"- Model: `{model}`", f"- Endpoint: `{endpoint}`", f"- Run: {now}",
        f"- Repository analyzed: `proj2`", "",
    ]
    for key, title, prompt in prompts:
        lines += [f"## {key} — {title}", "", "### Prompt", "", "```text", prompt, "```", "",
                  "### Result", "", results[key], ""]
    return "\n".join(lines)


def pdf_escape(value: str) -> str:
    return value.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")


def ascii_lines(markdown: str, width: int = 95) -> list[str]:
    plain = unicodedata.normalize("NFKD", markdown).encode("ascii", "replace").decode("ascii")
    out: list[str] = []
    for raw in plain.splitlines():
        if not raw:
            out.append("")
            continue
        out.extend(textwrap.wrap(raw, width=width, replace_whitespace=False,
                                 drop_whitespace=False) or [""])
    return out


def write_pdf(markdown: str, path: Path) -> None:
    """Write a dependency-free, searchable text PDF (Letter, Helvetica)."""
    per_page = 55
    pages = [ascii_lines(markdown)[i:i + per_page] for i in range(0, len(ascii_lines(markdown)), per_page)]
    objects: list[bytes] = []
    objects.append(b"<< /Type /Catalog /Pages 2 0 R >>")
    page_ids = [4 + i * 2 for i in range(len(pages))]
    kids = " ".join(f"{x} 0 R" for x in page_ids)
    objects.append(f"<< /Type /Pages /Kids [{kids}] /Count {len(pages)} >>".encode())
    objects.append(b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>")
    for index, lines in enumerate(pages):
        page_id = page_ids[index]
        content_id = page_id + 1
        objects.append(
            f"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] "
            f"/Resources << /Font << /F1 3 0 R >> >> /Contents {content_id} 0 R >>".encode()
        )
        commands = ["BT", "/F1 8 Tf", "10 TL", "36 756 Td"]
        for line in lines:
            commands.append(f"({pdf_escape(line)}) Tj")
            commands.append("T*")
        commands.append("ET")
        stream = "\n".join(commands).encode("latin-1")
        objects.append(f"<< /Length {len(stream)} >>\nstream\n".encode() + stream + b"\nendstream")
    pdf = bytearray(b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n")
    offsets = [0]
    for obj_id, obj in enumerate(objects, 1):
        offsets.append(len(pdf))
        pdf += f"{obj_id} 0 obj\n".encode() + obj + b"\nendobj\n"
    xref = len(pdf)
    pdf += f"xref\n0 {len(objects) + 1}\n0000000000 65535 f \n".encode()
    for offset in offsets[1:]:
        pdf += f"{offset:010d} 00000 n \n".encode()
    pdf += f"trailer\n<< /Size {len(objects) + 1} /Root 1 0 R >>\nstartxref\n{xref}\n%%EOF\n".encode()
    path.write_bytes(pdf)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--prompts", type=Path, default=DEFAULT_PROMPTS)
    parser.add_argument("--repo", type=Path, default=DEFAULT_REPO)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--base-url", default=os.getenv("LLAMA_BASE_URL", "https://api.groq.com/openai/v1"))
    parser.add_argument(
        "--model", default=os.getenv("LLAMA_MODEL", "auto"),
        help="provider model ID; default 'auto' selects an accessible Llama model",
    )
    parser.add_argument("--list-models", action="store_true", help="list accessible model IDs and exit")
    parser.add_argument(
        "--max-repo-chars", type=int, default=14_000,
        help="maximum repository-context characters per prompt (default: 14000 for free-tier APIs)",
    )
    parser.add_argument("--max-output-tokens", type=int, default=1200)
    parser.add_argument(
        "--request-delay", type=float, default=None,
        help="seconds between prompts (default: 60 for Groq free-tier compatibility, otherwise 0)",
    )
    parser.add_argument("--temperature", type=float, default=0.0)
    parser.add_argument("--timeout", type=int, default=180)
    parser.add_argument("--retries", type=int, default=3)
    args = parser.parse_args()
    api_key = os.getenv("LLAMA_API_KEY")
    if not api_key:
        parser.error("LLAMA_API_KEY is not set (the key is read from the environment only)")

    models = available_models(args.base_url, api_key, args.timeout)
    if args.list_models:
        print("\n".join(models) if models else "No models returned by the provider.")
        return 0
    if args.model == "auto":
        args.model = choose_llama_model(models)
        print(f"Automatically selected accessible Llama model: {args.model}", flush=True)
    elif args.model not in models:
        nongenerative_terms = ("guard", "moderation", "safety", "classifier", "embedding")
        llama_models = [
            model for model in models
            if "llama" in model.lower()
            and not any(term in model.lower() for term in nongenerative_terms)
        ]
        choices = ", ".join(llama_models) if llama_models else "none"
        raise RuntimeError(
            f"Model {args.model!r} is not exposed to this API key. "
            f"Accessible Llama models: {choices}. Omit --model/LLAMA_MODEL to auto-select."
        )

    prompts = parse_prompts(args.prompts)
    request_delay = args.request_delay
    if request_delay is None:
        request_delay = 60.0 if "api.groq.com" in args.base_url else 0.0
    results: dict[str, str] = {}
    for index, (key, title, prompt) in enumerate(prompts):
        print(f"Running {key}: {title}...", flush=True)
        snapshot = repository_snapshot(args.repo, args.max_repo_chars, key)
        system = (
            "You are analyzing the prompt-specific repository snapshot below. Treat it as the only "
            "repository evidence. File contents have stable line numbers prepended for citation. "
            "The file list is complete, but file contents may be omitted due to the API context limit; "
            "mark omitted evidence UNVERIFIED. Do not claim you ran commands or tests.\n" + snapshot
        )
        if key == "KP7":
            system += "\n\nFor KP7, this is KP5's actual output from the same run:\n" + results.get("KP5", "NONE")
        results[key] = call_llama(args.base_url, api_key, args.model, system, prompt,
                                  args.temperature, args.max_output_tokens, args.timeout, args.retries)
        if request_delay and index < len(prompts) - 1:
            print(f"Waiting {request_delay:g}s for the provider rate-limit window...", flush=True)
            time.sleep(request_delay)

    report = markdown_report(args.model, args.base_url, prompts, results)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    md_path = args.output.with_suffix(".md")
    pdf_path = args.output.with_suffix(".pdf")
    md_path.write_text(report, encoding="utf-8")
    write_pdf(report, pdf_path)
    print(f"Wrote {md_path}")
    print(f"Wrote {pdf_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())

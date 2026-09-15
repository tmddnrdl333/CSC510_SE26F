# Running the keeper prompts with Llama

The runner sends all eight fenced prompts from `keeper-prompts.md` verbatim to
an OpenAI-compatible Llama endpoint. It supplies a line-numbered snapshot of
`proj2` as system context, and supplies KP5's result to KP7 because KP7 requires
that result. API keys are read from the environment and are not saved.

## Run with Groq (default)

Create a Groq API key in your own Groq account, then run:

```sh
export LLAMA_API_KEY='your-key-here'
python3 proj1a-report/run_llama_prompts.py
```

The outputs are `proj1a-report/llama-results.md` and
`proj1a-report/llama-results.pdf`.

By default, the runner queries the provider's model list and selects an
accessible model whose ID contains `llama`. To inspect the model IDs exposed to
your key without running the prompts, use:

```sh
python3 run_llama_prompts.py --list-models
```

To choose a particular accessible Llama model, set `LLAMA_MODEL` as shown below.

## Use another compatible provider

```sh
export LLAMA_API_KEY='your-key-here'
export LLAMA_BASE_URL='https://provider.example/v1'
export LLAMA_MODEL='provider-llama-model-id'
python3 proj1a-report/run_llama_prompts.py
```

The endpoint must implement `POST /chat/completions` in OpenAI-compatible
format. No key should be added to this repository or committed to Git.

## Important limitation in KP3

KP3 contains the literal text `<paste the FirebaseAppError stack trace>` in the
source document. The runner preserves that wording, as required by the document,
so the model can only explain that the specific error is absent. Replace the
placeholder in `keeper-prompts.md` first if the assignment expects analysis of a
real stack trace.

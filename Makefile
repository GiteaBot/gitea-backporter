SRC_FILES := $(shell find src -type f -name '*.ts')

@PHONY: lint
lint:
	@deno lint --quiet
	@deno fmt --quiet --check
	@deno check --quiet $(SRC_FILES)

@PHONY: fmt
fmt:
	@deno fmt --quiet

@PHONY: test
test:
	@deno test -A

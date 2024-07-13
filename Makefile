SRC_FILES := $(shell find src -type f -name '*.ts')

@PHONY: lint
lint:
	@deno lint
	@deno check $(SRC_FILES)

@PHONY: fmt-check
fmt-check:
	@deno fmt --check

@PHONY: fmt
fmt:
	@deno fmt

@PHONY: test
test:
	@deno test -A

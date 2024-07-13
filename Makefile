SRC_FILES := $(shell find src -type f -name '*.ts')

@PHONY: lint
lint:
	@deno lint
	@deno check $(SRC_FILES)

@PHONY: fmt
fmt:
	@deno fmt --check

@PHONY: test
test:
	@deno test -A

# House of Legacy · ES3 Save Editor
# Static editor + optional live save server (no build step).

SHELL   := /bin/bash
NODE    ?= node
BIND    ?= 127.0.0.1
PORT    ?= 4173
SAVE    ?=
BROWSER ?= xdg-open

.DEFAULT_GOAL := help
.PHONY: help serve start dev check save-path backup open

help: ## Show this help
	@echo "House of Legacy · ES3 Save Editor"
	@echo ""
	@echo "Usage: make <target> [PORT=4173] [BIND=127.0.0.1] [SAVE=/path/to/GameData.es3]"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-12s\033[0m %s\n", $$1, $$2}'

serve: ## Start editor + live save server
	HOL_SAVE="$(SAVE)" HOST="$(BIND)" $(NODE) serve.mjs --port $(PORT)

start: serve ## Alias for serve

dev: ## Start with auto-restart when serve.mjs changes
	HOL_SAVE="$(SAVE)" HOST="$(BIND)" $(NODE) --watch serve.mjs --port $(PORT)

check: ## Syntax-check the server and browser scripts
	@for f in serve.mjs js/*.js; do $(NODE) --check "$$f" && echo "ok  $$f"; done

save-path: ## Print the auto-detected GameData.es3 path
	@$(NODE) serve.mjs --print-save

backup: ## Back up the save (auto-detected unless SAVE= is set)
	@save="$(SAVE)"; \
	if [ -z "$$save" ]; then save="$$($(NODE) serve.mjs --print-save)"; fi; \
	if [ ! -f "$$save" ]; then echo "Save not found: $$save" >&2; exit 1; fi; \
	dest="$$save.$(shell date +%Y%m%d-%H%M%S).bak"; \
	cp -v "$$save" "$$dest"

open: ## Open the editor in the default browser
	@$(BROWSER) http://$(BIND):$(PORT)/

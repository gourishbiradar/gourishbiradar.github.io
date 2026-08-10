.PHONY: help install build serve

help:
	@echo "Usage: make <target>"
	@echo ""
	@echo "  install   Install Ruby gem dependencies via Bundler"
	@echo "  build     Build the static site into _site/"
	@echo "  serve     Start local dev server at http://localhost:4000 with live reload"

install:
	bundle install

build:
	bundle exec jekyll build

serve:
	bundle exec jekyll serve

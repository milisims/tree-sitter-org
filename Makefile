
XDG_CONFIG_HOME ?= ~/.config

.PHONY: build
build: org.so

.PHONY: install
install: org.so
	mkdir -p $(XDG_CONFIG_HOME)/nvim/parser/
	cp org.so $(XDG_CONFIG_HOME)/nvim/parser/

org.so: src/parser.c src/scanner.cc
	gcc -o $@ -I./src $^ -shared -Os -lstdc++

.PHONY: clean
clean:
	$(RM) org.so

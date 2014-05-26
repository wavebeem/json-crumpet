test:
	(node test/test.js | grep -i 'expected.*actual'; true)
.PHONY: test

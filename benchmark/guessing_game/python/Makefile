# Makefile for Python Benchmark - Guessing Game (1A2B)
#
# Quick commands for testing and development

.PHONY: help test test-verbose test-var test-cas test-time test-integration clean

# Default target
help:
	@echo "Python Benchmark - Guessing Game (1A2B) - Available targets:"
	@echo ""
	@echo "  make test              - Run all ISA Resolver tests"
	@echo "  make test-verbose      - Run tests with verbose output"
	@echo "  make test-var          - Run VAR-System tests only"
	@echo "  make test-cas          - Run CAS-System tests only"
	@echo "  make test-time         - Run TIME-System tests only"
	@echo "  make test-integration  - Run Integration tests only"
	@echo "  make clean             - Clean up test cache and artifacts"
	@echo ""

# Run all tests
test:
	@echo "Running ISA Resolver tests..."
	@PYTHONPATH=src pytest test_isa_resolver.py

# Run tests with verbose output
test-verbose:
	@echo "Running ISA Resolver tests (verbose)..."
	@PYTHONPATH=src pytest test_isa_resolver.py -v

# Run VAR-System tests
test-var:
	@echo "Running VAR-System tests..."
	@PYTHONPATH=src pytest test_isa_resolver.py::TestVARSystem -v

# Run CAS-System tests
test-cas:
	@echo "Running CAS-System tests..."
	@PYTHONPATH=src pytest test_isa_resolver.py::TestCASSystem -v

# Run TIME-System tests
test-time:
	@echo "Running TIME-System tests..."
	@PYTHONPATH=src pytest test_isa_resolver.py::TestTIMESystem -v

# Run Integration tests
test-integration:
	@echo "Running Integration tests..."
	@PYTHONPATH=src pytest test_isa_resolver.py::TestIntegration -v

# Clean up
clean:
	@echo "Cleaning up test artifacts..."
	@find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	@find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
	@find . -type f -name "*.pyc" -delete 2>/dev/null || true
	@echo "✓ Cleanup complete"

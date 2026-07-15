.PHONY: dev dev-backend dev-frontend install install-backend install-frontend hooks clean help up down logs seed reset-db rebuild test test-backend test-frontend benchmark

# Colors for help text
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[0;33m
NC := \033[0m # No Color

##@ Development

dev: ## Start both frontend and backend servers with prefixed output (Ctrl+C to stop both)
	@echo "$(GREEN)Starting MonSTAR development servers...$(NC)"
	@echo "$(YELLOW)Press Ctrl+C to stop both servers$(NC)"
	@bash -c '\
		trap "trap - SIGTERM && kill -- -$$$$" SIGINT SIGTERM EXIT; \
		(cd backend && npm run dev 2>&1 | sed "s/^/$$(printf "\033[0;34m")[BACKEND]$$(printf "\033[0m") /") & \
		BACKEND_PID=$$!; \
		(cd frontend && npm start 2>&1 | sed "s/^/$$(printf "\033[0;32m")[FRONTEND]$$(printf "\033[0m") /") & \
		FRONTEND_PID=$$!; \
		wait $$BACKEND_PID $$FRONTEND_PID \
	'

dev-backend: ## Start only the backend server
	@echo "$(BLUE)Starting backend server...$(NC)"
	cd backend && npm run dev

dev-frontend: ## Start only the frontend server
	@echo "$(GREEN)Starting frontend server...$(NC)"
	cd frontend && npm start

##@ Docker

up: ## Start frontend, backend, and MongoDB in the background (first run builds and seeds)
	docker compose up --build -d

down: ## Stop all containers (database data survives)
	docker compose down

logs: ## Follow logs from all services
	docker compose logs -f

seed: ## Run the database seeder (does nothing if data exists)
	docker compose run --rm seed

reset-db: ## Wipe the database and reseed with sample data
	docker compose run --rm seed npm run seed -- --reset

rebuild: ## Full rebuild after dependency changes (removes volumes, reseeds)
	docker compose down -v
	docker compose up --build -d

##@ Installation

install: install-backend install-frontend hooks ## Install dependencies for both frontend and backend
	@echo "$(GREEN)All dependencies installed successfully!$(NC)"

install-backend: ## Install backend dependencies
	@echo "$(BLUE)Installing backend dependencies...$(NC)"
	cd backend && npm install

install-frontend: ## Install frontend dependencies
	@echo "$(GREEN)Installing frontend dependencies...$(NC)"
	cd frontend && npm install

hooks: ## Enable project git hooks (Conventional Commit message check)
	@git config core.hooksPath .githooks
	@echo "$(BLUE)Git hooks enabled (.githooks)$(NC)"

##@ Testing

test: test-backend test-frontend ## Run backend and frontend tests
	@echo "$(GREEN)All tests complete$(NC)"

test-backend: ## Run backend tests (vitest)
	@echo "$(BLUE)Running backend tests...$(NC)"
	cd backend && npm test

test-frontend: ## Run frontend tests (ng test, headless single-run)
	@echo "$(GREEN)Running frontend tests...$(NC)"
	cd frontend && npm test -- --watch=false --browsers=ChromeHeadless

benchmark: ## Benchmark APIs with artillery
	@echo "$(YELLOW)Benchmarking APIs...$(NC)"
	cd backend && artillery run artillery.yml
	@echo "$(GREEN)Benchmarks of APIs complete$(NC)"

##@ Cleanup

clean: ## Remove all node_modules
	@echo "$(YELLOW)Removing node_modules...$(NC)"
	rm -rf backend/node_modules
	rm -rf frontend/node_modules
	@echo "$(GREEN)Cleanup complete!$(NC)"

##@ Utility

help: ## Display this help message
	@awk 'BEGIN {FS = ":.*##"; printf "\n$(BLUE)Usage:$(NC)\n  make $(YELLOW)<target>$(NC)\n"} /^[a-zA-Z_-]+:.*?##/ { printf "  $(YELLOW)%-20s$(NC) %s\n", $$1, $$2 } /^##@/ { printf "\n$(BLUE)%s$(NC)\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

# Default target
.DEFAULT_GOAL := help

.PHONY: dev-server dev-client run

dev-server:
	cd server && pnpx tsx --watch src/index.ts

dev-client:
	cd client && pnpm run dev

run: 
	@$(MAKE) -j 2 dev-server dev-client

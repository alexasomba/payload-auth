# Contributing to Payload Auth

Below you'll find a set of guidelines for how to contribute to Payload Auth.

## Running the tests

The test suite (`packages/payload-auth`) boots a real Payload instance backed by Postgres, so you need a database available before running it.

1. Start a local Postgres instance for the tests: `docker compose -f docker-compose.test.yml up -d`
2. On a fresh checkout, build the package first: `cd packages/payload-auth && pnpm build`. Tests import package subpaths from `dist/`.
3. Point `DATABASE_URL` at a fresh, disposable test database and run `PAYLOAD_AUTH_TEST_SCHEMA_PUSH=1 pnpm test:run` from the repository root. The test fixture generates its schema from the current Payload 4 configuration; do not enable schema push against a database containing data to keep.
4. The historical test migrations predate the current Payload 4 schema and are not the migration path for applications using this plugin. Applications generate and review their own Payload migrations.

Commit messages must follow the [Conventional Commits](https://www.conventionalcommits.org/) format — CI enforces this with commitlint.

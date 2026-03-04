# My App Template

A full-stack template with Next.js 16 + Hono API.
This repository is designed with the premise of "solidify `docs/domain` first, then implement."

## One-shot Setup (Recommended)

When starting from this template, run the following steps in order.

1. **Create a new repository from the template**
2. **Choose a project identifier** (e.g., `my-app`)
3. **Define domain specs in one go**
   - Run `/domain-spec-kickoff` with an AI agent
   - Initialize `docs/domain/*.md` in a single interview
4. **Replace `@my-app` with your project identifier**
   - Targets: `package.json` (root + workspaces), `infrastructure/terraform/`, `renovate*.json`, `.github/workflows/`, `compose.test.yaml`
5. **Create local environment variables**
   - Create `.env.local` at the repository root
   - Minimal example:

```bash
DATABASE_URL=mysql://root@127.0.0.1:4000/test
SERVER_PORT=4001
FRONTEND_URL=http://localhost:3001
BETTER_AUTH_URL=http://localhost:4001
NEXT_PUBLIC_API_BASE_URL=http://localhost:4001
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=
# Only when using HTTPS
# SSL_KEY_PATH=services/web/certificates/key.pem
# SSL_CERT_PATH=services/web/certificates/cert.pem
```

6. **Install dependencies and start development**

```bash
pnpm install
pnpm dev
```

7. **DB / Smoke test**

```bash
pnpm db:studio
```

## Domain-first Workflow

This template treats `docs/domain/` as the Single Source of Truth for specifications.

1. Spec initialization: `/domain-spec-kickoff`
2. Spec updates during implementation: `/domain-doc-evolution`
3. When specs change, always update `docs/domain` before implementing

See [docs/domain/README.md](docs/domain/README.md) for details.

## Skills

Key skills are located in `.agent/skills/`.

- `init-project`: Existing template initialization flow
- `domain-spec-kickoff`: Bootstrap specs in a single interview
- `domain-doc-evolution`: Evolve `docs/domain` when specs change
- `unit-testing` / `integration-testing` / `api-testing` / `ui-testing` / `vrt-testing` / `e2e-testing`: Implementation guidelines for each test type
- `twada-tdd`: Run TDD based on t_wada's approach
- `update-docs`: Sync docs with code changes
- `sql-antipatterns`: Detect and avoid DB design and SQL implementation antipatterns

## Documentation

| Category | Overview |
| --- | --- |
| [docs/domain/](docs/domain/) | Domain specs (project-specific SSoT) |
| [docs/web-frontend/](docs/web-frontend/) | Frontend design and conventions |
| [docs/testing/](docs/testing/) | Unit/Integration/API/UI/VRT/E2E test implementation guidelines |
| [docs/backend/](docs/backend/) | Backend design and conventions |
| [docs/design/](docs/design/) | Design system |
| [docs/infra/](docs/infra/) | Terraform and CI/CD |
| [docs/security/](docs/security/) | Security and linting |

### Docs Writing

- Writing principles: [docs/design/writing.md](docs/design/writing.md)
- textlint operations: [docs/security/textlint.md](docs/security/textlint.md)

## HTTPS (Self-signed Certificate)

If you need HTTPS on a local IP, generate a certificate.

```bash
cd services/web/certificates
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout key.pem \
  -out cert.pem \
  -subj "/CN=localhost" \
  -addext "subjectAltName=DNS:localhost,IP:127.0.0.1,IP:<YOUR_IP>"
```

Replace `<YOUR_IP>` with your actual IP address.

## Quality Check

Always run the following after code changes.

```bash
./scripts/post-edit-check.sh
```

## Claude Code

- Project instructions: `CLAUDE.md` (symlink to `AGENTS.md`)
- Permission/Hook settings: `.claude/settings.json`
- Custom `/` skills: `.claude/skills/quality-check/SKILL.md`
- `PreToolUse` blocks dangerous Bash commands (`git push`, `git add -A`, `git reset --hard`)

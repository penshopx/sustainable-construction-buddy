# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Use the guarded release command so the production application and the
`competency-insight` Edge Function are released together:

```sh
npm run release
```

Set `SUPABASE_PROJECT_REF` in the production release environment to the
expected Supabase project reference, independently of `supabase/config.toml`.
The publisher refuses to deploy if the release ref is missing, invalid, or
different from the TOML `project_id`. Do not derive this release setting from
the TOML file.

Set `SUPABASE_URL` independently to `https://<SUPABASE_PROJECT_REF>.supabase.co`
(one trailing slash is allowed). Both publication and the standalone live probe
reject any other destination before making requests. Credentials, query strings,
fragments, ports, and additional paths are not accepted in this URL. The probe
also requires the expected `SUPABASE_PROJECT_REF`; it never infers it from the URL.

The release owner must confirm the production destination and authorize setting
`SUPABASE_PROJECT_REF` in the **production** environment. This environment
setting is managed independently of the Supabase TOML file; development/shared
values are not substituted by the publisher. Changing the production destination
requires a fresh owner confirmation. Configuration approval is not approval to
publish.

To validate the configuration without publishing, run this in the release
environment (where `SUPABASE_PROJECT_REF` is already set):

```sh
npm run check:release-config
```

This uses the same ref checks as the publisher, but does not run Supabase CLI,
deploy, or the live probe. A successful result says `deployment: "not_started"`;
it is not proof of a production publication. Wrong, invalid, or missing refs
still return a non-zero exit status. Unknown CLI flags are rejected rather than
falling through to deployment. Configuration checks require no production
credentials; automated publication-gate tests use isolated synthetic credentials.

The release runs the standard insight validator, TypeScript check, and
frontend build, then invokes `npm run publish:insight`. The standard validator
covers the local contract tests and publication gate. That publisher deploys
the Edge Function and runs the live contract probe. A validation, deployment,
or probe failure returns a non-zero status and blocks the release; failure
summaries are sanitized JSON retained in the release log. Do not deploy
`competency-insight` directly with the Supabase CLI.

## Quality checks

Run the standard competency insight validation before releasing. It runs both
the insight contract checks and the deterministic publication gate; either
failure stops the validation with a non-zero status:

```sh
npm run test:insight:validate
```

`npm run validate:insight` remains available as a compatibility alias. Run the
full TypeScript check independently when checking the frontend:

```sh
npm run typecheck
```

`npm run build` runs this check automatically before Vite creates the production bundle.

Every pull request runs the same standard validation in
`.github/workflows/insight-validation.yml`. The workflow's source-of-truth
command is `npm run test:insight:validate`; because that command includes both
the insight contract checks and the deterministic publication gate, either
failure makes the pull request check fail.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)

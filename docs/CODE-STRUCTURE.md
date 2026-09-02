# BRGYWEB-LITE Code Structure

BRGYWEB-LITE uses plain HTML, CSS, and JavaScript.

## JavaScript areas

- `assets/js/core/`: shared configuration and infrastructure.
- `assets/js/public/`: resident-facing page behavior.
- `assets/js/admin/`: administrator behavior.
- `assets/js/editor/`: editor/staff behavior.
- `assets/js/`: temporary legacy/shared modules while migration is incomplete.

## Conventions

Use descriptive lowercase kebab-case filenames. Inside grouped folders, do not repeat the role in the filename. Preserve dependency order when moving scripts: vendor libraries, core/shared configuration, shared runtime, then page-specific modules.

Major modules should have short useful documentation for purpose, dependencies, and usage when helpful. Section comments should mark meaningful boundaries, not obvious syntax.

Never delete a legacy file until every HTML/runtime reference has been migrated and checked. Keep `main` deployable after each structural change.

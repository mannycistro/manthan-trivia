# Architecture rules
- Keep edit-board presentation in separate components and reuse EditPanel for changes; gameplay and saved board schemas remain independent of editor presentation.
- Resolve editor media references only while previews are visible and revoke temporary object URLs on cleanup; use existing IndexedDB storage without changing persistence.
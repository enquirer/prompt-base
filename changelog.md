# Release history

## v2.0.2

**Added**

- `.getDefault` method: to consistently get the `options.default` on any prompt type: input, list, choices etc.

## v2.0.0

**Potentially breaking changes**

- Changes how the `actions` property is initialized. It's unlikely that this will break anyone's code, since it doesn't change any of the behavior or functionality, but a major bump seemed appropriate just in case.

## v1.0.0

**Breaking changes**

- converted hard-coded prototype-methods-as-listeners to [prompt-actions][]. This makes it much easier for custom prompts to change behavior without overriding entire prototype methods.

## v0.8.2 - 2017-05-12

- 100% tests coverage
- various bugfixes and improvements in event handling
- ensures nested prompts are working correctly
- fixes `.getAnswer` to always work with `.ask` or `.run`
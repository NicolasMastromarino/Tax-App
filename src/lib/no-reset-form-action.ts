import { startTransition, type FormEvent } from "react";

/**
 * React's `<form action={fn}>` automatically calls the native
 * `form.reset()` after the action settles -- on a validation failure, not
 * just success -- and it does this outside React's own render cycle. That
 * desyncs controlled fields (they visually snap back to their first/empty
 * HTML value until some unrelated re-render restores them from state) and
 * permanently wipes uncontrolled ones (a plain `defaultValue` Input has no
 * state to restore from, so whatever the user typed is just gone).
 *
 * Submitting through onSubmit + FormData instead of the `action` prop skips
 * native form submission entirely, so this reset never fires -- every field
 * keeps exactly what the user typed when a submission comes back with
 * errors. `dispatch` is the function `useActionState` returns (its second
 * tuple element); it accepts a FormData directly, same as when it's wired
 * up via `action=`. Calling it outside a transition (React warns loudly
 * about this) leaves `pending` from useActionState stuck/incorrect, so it's
 * wrapped in `startTransition` here -- the same wrapping `action=` does
 * for you automatically.
 */
export function noResetSubmit(dispatch: (formData: FormData) => void) {
  return (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(() => dispatch(formData));
  };
}

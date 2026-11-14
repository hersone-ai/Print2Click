import { Children, cloneElement, isValidElement, type AriaAttributes, type ReactNode, type ReactElement } from 'react';

export function FormField({ label, htmlFor, hint, error, children }: { label: string; htmlFor: string; hint?: string; error?: string; children: ReactNode }) {
  const child = Children.only(children);
  const descriptionId = error ? `${htmlFor}-error` : hint ? `${htmlFor}-hint` : undefined;
  const existingDescription = isValidElement<{ 'aria-describedby'?: string }>(child) ? child.props['aria-describedby'] : undefined;
  const describedBy = [existingDescription, descriptionId].filter(Boolean).join(' ') || undefined;
  const control = isValidElement<{ 'aria-describedby'?: string; 'aria-invalid'?: AriaAttributes['aria-invalid'] }>(child)
    ? cloneElement(child as ReactElement<{ 'aria-describedby'?: string; 'aria-invalid'?: AriaAttributes['aria-invalid'] }>, { 'aria-describedby': describedBy, 'aria-invalid': error ? true : child.props['aria-invalid'] })
    : child;
  return <div className="space-y-2">
    <label htmlFor={htmlFor} className="block text-sm font-medium text-foreground">{label}</label>
    {control}
    {error ? <p id={`${htmlFor}-error`} className="text-xs leading-5 text-danger">{error}</p> : hint ? <p id={`${htmlFor}-hint`} className="text-xs leading-5 text-subtle">{hint}</p> : null}
  </div>;
}

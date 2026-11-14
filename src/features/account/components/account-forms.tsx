'use client';

import { useActionState, useEffect, useRef, useState, type FormEvent } from 'react';
import { useFormStatus } from 'react-dom';
import { LoaderCircle, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Notice } from '@/components/ui/notice';
import { saveAccountAction, requestPasswordChangeAction } from '@/features/account/actions';
import { accountFieldErrors, parseAccountProfileForm, socialPlatforms, type AccountProfile, type AccountActionState, type AccountFieldErrors, type AccountFieldName } from '@/features/account/domain';
import { ProfileAvatar } from '@/features/account/components/profile-avatar';
import { GoogleMark } from '@/features/auth/components/auth-shell';

const initialState: AccountActionState = {};
const cardHeader = 'border-0 px-5 pb-0 pt-5 sm:px-6 sm:pt-6';
const cardContent = 'space-y-5 p-5 sm:p-6';

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return <Button type="submit" variant="primary" disabled={pending} aria-busy={pending}>
    {pending && <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />}
    {pending ? pendingLabel : label}
  </Button>;
}

function PhoneFields({ prefix, label, initial, errors, disabled = false }: {
  prefix: 'mobile' | 'whatsapp'; label: string; initial: AccountProfile['mobile']; errors: AccountFieldErrors; disabled?: boolean;
}) {
  return <fieldset disabled={disabled} className={`space-y-2 ${disabled ? 'hidden' : ''}`}>
    <legend className="text-sm font-medium text-foreground">{label}</legend>
    <div className="grid grid-cols-[minmax(88px,1fr)_minmax(0,2.5fr)] gap-3">
      <FormField label="Country code" htmlFor={`${prefix}DialCode`} error={errors[`${prefix}DialCode`]}>
        <Input id={`${prefix}DialCode`} name={`${prefix}DialCode`} type="tel" inputMode="tel" autoComplete="off" list="account-dial-codes" placeholder="+91" maxLength={5} defaultValue={initial.dialCode} />
      </FormField>
      <FormField label="Number" htmlFor={`${prefix}Number`} error={errors[`${prefix}Number`]}>
        <Input id={`${prefix}Number`} name={`${prefix}Number`} type="tel" inputMode="numeric" autoComplete="tel-national" placeholder="Digits only" maxLength={14} defaultValue={initial.number} />
      </FormField>
    </div>
  </fieldset>;
}

function AddressFields({ initial, errors }: { initial: AccountProfile['address']; errors: AccountFieldErrors }) {
  return <Card className="rounded-2xl">
    <CardHeader className={cardHeader}><h2 className="text-lg font-semibold">Communication address <span className="text-sm font-normal text-muted-foreground">(optional)</span></h2></CardHeader>
    <CardContent className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
      <div className="sm:col-span-2"><FormField label="Recipient name" htmlFor="addressRecipient" error={errors.addressRecipient}><Input id="addressRecipient" name="addressRecipient" autoComplete="name" maxLength={120} defaultValue={initial.recipient} /></FormField></div>
      <div className="sm:col-span-2"><FormField label="Address line 1" htmlFor="addressLine1" error={errors.addressLine1}><Input id="addressLine1" name="addressLine1" autoComplete="address-line1" maxLength={500} defaultValue={initial.line1} /></FormField></div>
      <div className="sm:col-span-2"><FormField label="Address line 2" htmlFor="addressLine2" error={errors.addressLine2}><Input id="addressLine2" name="addressLine2" autoComplete="address-line2" maxLength={160} defaultValue={initial.line2} /></FormField></div>
      <FormField label="City" htmlFor="addressCity" error={errors.addressCity}><Input id="addressCity" name="addressCity" autoComplete="address-level2" maxLength={100} defaultValue={initial.city} /></FormField>
      <FormField label="State or region" htmlFor="addressRegion" error={errors.addressRegion}><Input id="addressRegion" name="addressRegion" autoComplete="address-level1" maxLength={100} defaultValue={initial.region} /></FormField>
      <FormField label="Postal code" htmlFor="addressPostalCode" error={errors.addressPostalCode}><Input id="addressPostalCode" name="addressPostalCode" autoComplete="postal-code" maxLength={20} defaultValue={initial.postalCode} /></FormField>
      <FormField label="Country" htmlFor="addressCountry" error={errors.addressCountry}><Input id="addressCountry" name="addressCountry" autoComplete="country-name" maxLength={100} defaultValue={initial.country} /></FormField>
    </CardContent>
  </Card>;
}

export function AccountProfileForm({ userId, profile, email, providers }: { userId: string; profile: AccountProfile; email: string; providers: string[] }) {
  const [state, action, pending] = useActionState(saveAccountAction, initialState);
  const [sameAsMobile, setSameAsMobile] = useState(profile.whatsappSameAsMobile);
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [errors, setErrors] = useState<AccountFieldErrors>({});
  const [edited, setEdited] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    setErrors(state.fieldErrors || {});
    setEdited(false);
    const firstField = Object.keys(state.fieldErrors || {})[0];
    if (firstField) (formRef.current?.elements.namedItem(firstField) as HTMLElement | null)?.focus();
  }, [state]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    setEdited(true);
    const parsed = parseAccountProfileForm(new FormData(event.currentTarget));
    if (parsed.success) { setErrors({}); return; }
    event.preventDefault();
    const fieldErrors = accountFieldErrors(parsed.error);
    setErrors(fieldErrors);
    const firstField = Object.keys(fieldErrors)[0];
    if (firstField) (event.currentTarget.elements.namedItem(firstField) as HTMLElement | null)?.focus();
  }

  function handleInput(event: FormEvent<HTMLFormElement>) {
    const field = event.target as HTMLInputElement;
    if (!field.name) return;
    setEdited(true);
    if (field.name === 'displayName') setDisplayName(field.value);
    setErrors((current) => ({ ...current, [field.name as AccountFieldName]: undefined }));
  }

  return <>
    <form id="account-profile" ref={formRef} action={action} onSubmit={handleSubmit} onInput={handleInput} noValidate className="grid items-start gap-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.4fr)]">
      <datalist id="account-dial-codes"><option value="+91" label="India" /><option value="+1" label="US / Canada" /><option value="+44" label="United Kingdom" /><option value="+61" label="Australia" /><option value="+971" label="UAE" /></datalist>
      <div className="space-y-6">
        <Card className="rounded-2xl">
          <CardHeader className={cardHeader}><h2 className="text-lg font-semibold">Your profile</h2></CardHeader>
          <CardContent className={cardContent}>
            <div className="flex flex-col gap-5 sm:flex-row">
              <ProfileAvatar userId={userId} displayName={displayName} />
              <div className="min-w-0 flex-1 space-y-4">
                <FormField label="Display name" htmlFor="displayName" error={errors.displayName}><Input id="displayName" name="displayName" autoComplete="name" maxLength={80} defaultValue={profile.displayName} /></FormField>
                <div><p className="mb-2 text-sm font-medium">Email</p><p className="rounded-control border border-border bg-muted px-3 py-2.5 text-sm break-all">{email}</p></div>
              </div>
            </div>
            <div><p className="mb-2 text-sm font-medium">Linked accounts</p>{providers.length ? <ul className="flex flex-wrap gap-2">{providers.map((provider) => <li key={provider} className="inline-flex items-center gap-2 rounded-control border border-border bg-muted px-3 py-2 text-sm">{provider === 'google' ? <GoogleMark /> : <Mail size={16} aria-hidden="true" />}{provider === 'google' ? 'Google' : provider === 'email' ? 'Email and password' : provider}</li>)}</ul> : <p className="text-sm text-muted-foreground">No linked provider details are available.</p>}</div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardHeader className={cardHeader}><h2 className="text-lg font-semibold">Company & social <span className="text-sm font-normal text-muted-foreground">(optional)</span></h2></CardHeader>
          <CardContent className={cardContent}>
            <FormField label="Company name" htmlFor="company" error={errors.company}><Input id="company" name="company" autoComplete="organization" maxLength={120} defaultValue={profile.company} /></FormField>
            {socialPlatforms.map((platform) => <FormField key={platform} label={platform} htmlFor={platform} error={errors[platform]}><Input id={platform} name={platform} type="url" inputMode="url" placeholder={`https://${platform === 'X' ? 'x.com' : `${platform.toLowerCase()}.com`}/your-profile`} defaultValue={profile.socials[platform]} maxLength={300} /></FormField>)}
          </CardContent>
        </Card>
      </div>
      <div className="space-y-6">
        <Card className="rounded-2xl">
          <CardHeader className={cardHeader}><h2 className="text-lg font-semibold">Contact details <span className="text-sm font-normal text-muted-foreground">(optional)</span></h2></CardHeader>
          <CardContent className={cardContent}>
            <div className="grid gap-5 sm:grid-cols-2">
              <PhoneFields prefix="mobile" label="Mobile contact number" initial={profile.mobile} errors={errors} />
              <PhoneFields prefix="whatsapp" label="WhatsApp number" initial={profile.whatsapp} errors={errors} disabled={sameAsMobile} />
            </div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="whatsappSameAsMobile" checked={sameAsMobile} onChange={(event) => { setSameAsMobile(event.target.checked); setEdited(true); setErrors((current) => ({ ...current, whatsappDialCode: undefined, whatsappNumber: undefined })); }} className="h-4 w-4 accent-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus" />WhatsApp uses my mobile number</label>
            <FormField label="Website address" htmlFor="website" error={errors.website}><Input id="website" name="website" type="url" inputMode="url" placeholder="https://example.com" maxLength={300} defaultValue={profile.website} /></FormField>
          </CardContent>
        </Card>
        <AddressFields initial={profile.address} errors={errors} />
      </div>
    </form>
    <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.4fr)]"><div className="lg:col-start-2"><ChangePasswordForm /></div></div>
    <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Nothing is published automatically.</p>
        {state.error && !edited && <Notice variant="error">{state.error}</Notice>}
        {state.success && !edited && <Notice variant="success">{state.success}</Notice>}
      </div>
      <Button type="submit" form="account-profile" variant="primary" disabled={pending} aria-busy={pending} className="shrink-0">
        {pending && <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />}{pending ? 'Saving profile…' : 'Save profile'}
      </Button>
    </div>
  </>;
}

export function ChangePasswordForm() {
  const [state, action] = useActionState(requestPasswordChangeAction, initialState);
  return <Card className="rounded-2xl">
    <CardHeader className={cardHeader}><h2 className="text-lg font-semibold">Password & security</h2></CardHeader>
    <CardContent className={cardContent}>
      <p className="text-sm text-muted-foreground">We’ll email a secure link to change your password.</p>
      {state.error && <Notice variant="error">{state.error}</Notice>}
      {state.success && <Notice variant="info">{state.success}</Notice>}
      <form action={action}><SubmitButton label="Change password" pendingLabel="Sending secure link…" /></form>
    </CardContent>
  </Card>;
}

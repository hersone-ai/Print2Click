'use client';

import { useRef, useState } from 'react';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { passwordInputPattern } from '@/features/auth/domain';

export function PasswordFields({ newLabel = 'Password' }: { newLabel?: string }) {
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const confirmationRef = useRef<HTMLInputElement>(null);
  const mismatch = confirmation.length > 0 && confirmation !== password;

  return <>
    <FormField label={newLabel} htmlFor="password" hint="At least 8 characters, one uppercase letter, and one special character.">
      <Input id="password" name="password" type="password" autoComplete="new-password" minLength={8} maxLength={128} pattern={passwordInputPattern} title="Use at least 8 characters, including one uppercase letter and one special character." required value={password} onChange={(event) => { setPassword(event.target.value); confirmationRef.current?.setCustomValidity(confirmation && confirmation !== event.target.value ? 'Passwords do not match.' : ''); }} />
    </FormField>
    <FormField label={newLabel === 'Password' ? 'Confirm password' : 'Confirm new password'} htmlFor="confirmPassword">
      <Input ref={confirmationRef} id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" minLength={8} maxLength={128} required value={confirmation} onChange={(event) => { setConfirmation(event.target.value); event.target.setCustomValidity(event.target.value && event.target.value !== password ? 'Passwords do not match.' : ''); }} aria-invalid={mismatch} aria-describedby={mismatch ? 'password-match-error' : undefined} />
    </FormField>
    {mismatch && <p id="password-match-error" role="alert" className="text-xs text-danger">Passwords do not match.</p>}
  </>;
}

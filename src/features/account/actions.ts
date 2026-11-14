'use server';

import { revalidatePath } from 'next/cache';
import { accountFieldErrors, parseAccountProfileForm, type AccountActionState } from '@/features/account/domain';
import { requestAccountPasswordChange, saveAccountProfile } from '@/server/services/account-service';

export async function saveAccountAction(_previous: AccountActionState, formData: FormData): Promise<AccountActionState> {
  const parsed = parseAccountProfileForm(formData);
  if (!parsed.success) return { fieldErrors: accountFieldErrors(parsed.error) };
  const error = await saveAccountProfile(parsed.data);
  if (error) return { error };
  revalidatePath('/account');
  return { success: 'Your profile was saved.' };
}

export async function requestPasswordChangeAction(_previous: AccountActionState): Promise<AccountActionState> {
  void _previous;
  const error = await requestAccountPasswordChange();
  return error ? { error } : { success: 'Check your email for a password link. Use the newest link to set a new password.' };
}

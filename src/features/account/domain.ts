import { z } from 'zod';

const dialCode = z.string().regex(/^\+[1-9]\d{0,3}$/, 'Enter a country code such as +91.');
const nationalNumber = z.string().regex(/^\d{4,14}$/, 'Use digits only, without the country code.');

const phone = z.object({
  dialCode: z.string().trim(),
  number: z.string().trim(),
}).superRefine((value, context) => {
  if (!value.dialCode && !value.number) return;
  if (!dialCode.safeParse(value.dialCode).success) context.addIssue({ code: 'custom', path: ['dialCode'], message: 'Enter a country code, such as +91.' });
  if (!nationalNumber.safeParse(value.number).success) context.addIssue({ code: 'custom', path: ['number'], message: 'Enter 4 to 14 digits.' });
  if (dialCode.safeParse(value.dialCode).success && nationalNumber.safeParse(value.number).success && value.dialCode.length - 1 + value.number.length > 15) {
    context.addIssue({ code: 'custom', path: ['number'], message: 'Use no more than 15 digits including the country code.' });
  }
});

const secureUrl = z.string().trim().max(300).refine((value) => {
  if (!value) return true;
  try { return new URL(value).protocol === 'https:'; } catch { return false; }
}, 'Enter a full https:// address.');

const fullHttpsUrl = z.string().trim().max(300, 'Keep the link under 300 characters.').refine((value) => {
  if (!value) return true;
  if (!/^https:\/\//i.test(value)) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname.includes('.') && !url.username && !url.password;
  } catch { return false; }
}, 'Enter a valid link starting with https://.');

const socialHosts = {
  Instagram: ['instagram.com'],
  Facebook: ['facebook.com', 'fb.com'],
  LinkedIn: ['linkedin.com'],
  X: ['x.com', 'twitter.com'],
} as const;

function socialLink(platform: keyof typeof socialHosts) {
  return fullHttpsUrl.refine((value) => {
    if (!value) return true;
    try {
      const host = new URL(value).hostname.toLowerCase();
      return socialHosts[platform].some((domain: string) => host === domain || host.endsWith(`.${domain}`));
    } catch { return false; }
  }, `Enter a ${platform} link.`);
}

export const socialPlatforms = ['Instagram', 'Facebook', 'LinkedIn', 'X'] as const;

export function profileInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length > 1) return `${Array.from(words[0])[0] ?? ''}${Array.from(words.at(-1) ?? '')[0] ?? ''}`.toLocaleUpperCase();
  return Array.from(words[0] ?? '').slice(0, 2).join('').toLocaleUpperCase() || '—';
}

export const emptyAddress = {
  recipient: '', line1: '', line2: '', city: '', region: '', postalCode: '', country: '',
};

const addressSchema = z.object({
  recipient: z.string().trim().max(120, 'Use 120 characters or fewer.'),
  line1: z.string().trim().max(500, 'Use 500 characters or fewer.'),
  line2: z.string().trim().max(160, 'Use 160 characters or fewer.'),
  city: z.string().trim().max(100, 'Use 100 characters or fewer.'),
  region: z.string().trim().max(100, 'Use 100 characters or fewer.'),
  postalCode: z.string().trim().max(20, 'Use 20 characters or fewer.').refine((value) => !value || /^[\p{L}\p{N}][\p{L}\p{N} -]*$/u.test(value), 'Use letters, numbers, spaces, or hyphens.'),
  country: z.string().trim().max(100, 'Use 100 characters or fewer.'),
});

const completeAddressSchema = addressSchema.superRefine((address, context) => {
  if (!Object.values(address).some(Boolean)) return;
  if (!address.line1) context.addIssue({ code: 'custom', path: ['line1'], message: 'Enter the street address.' });
  if (!address.city) context.addIssue({ code: 'custom', path: ['city'], message: 'Enter the city.' });
  if (!address.country) context.addIssue({ code: 'custom', path: ['country'], message: 'Enter the country.' });
});

export const accountProfileSchema = z.object({
  displayName: z.string().trim().min(1, 'Enter a display name.').max(80),
  mobile: phone,
  whatsappSameAsMobile: z.boolean(),
  whatsapp: phone,
  website: secureUrl,
  address: addressSchema,
  company: z.string().trim().max(120),
  socials: z.object({
    Instagram: secureUrl,
    Facebook: secureUrl,
    LinkedIn: secureUrl,
    X: secureUrl,
  }),
});

const accountProfileInputSchema = accountProfileSchema.extend({
  address: completeAddressSchema,
  website: fullHttpsUrl,
  socials: z.object({
    Instagram: socialLink('Instagram'),
    Facebook: socialLink('Facebook'),
    LinkedIn: socialLink('LinkedIn'),
    X: socialLink('X'),
  }),
}).superRefine((profile, context) => {
  if (profile.whatsappSameAsMobile && !profile.mobile.number) {
    context.addIssue({ code: 'custom', path: ['mobile', 'number'], message: 'Add a mobile number to use it for WhatsApp.' });
  }
});

export type AccountFieldName = 'displayName' | 'mobileDialCode' | 'mobileNumber' | 'whatsappDialCode' | 'whatsappNumber' | 'website' | 'addressRecipient' | 'addressLine1' | 'addressLine2' | 'addressCity' | 'addressRegion' | 'addressPostalCode' | 'addressCountry' | 'company' | typeof socialPlatforms[number];
export type AccountFieldErrors = Partial<Record<AccountFieldName, string>>;

export function parseAccountProfileForm(formData: FormData) {
  const value = (name: string) => {
    const field = formData.get(name);
    return typeof field === 'string' ? field : '';
  };
  return accountProfileInputSchema.safeParse({
    displayName: value('displayName'),
    mobile: { dialCode: value('mobileDialCode'), number: value('mobileNumber') },
    whatsappSameAsMobile: formData.get('whatsappSameAsMobile') === 'on',
    whatsapp: { dialCode: value('whatsappDialCode'), number: value('whatsappNumber') },
    website: value('website'),
    address: {
      recipient: value('addressRecipient'), line1: value('addressLine1'), line2: value('addressLine2'),
      city: value('addressCity'), region: value('addressRegion'),
      postalCode: value('addressPostalCode'), country: value('addressCountry'),
    },
    company: value('company'),
    socials: Object.fromEntries(socialPlatforms.map((platform) => [platform, value(platform)])),
  });
}

export function accountFieldErrors(error: z.ZodError): AccountFieldErrors {
  const names: Record<string, AccountFieldName> = {
    displayName: 'displayName', 'mobile.dialCode': 'mobileDialCode', 'mobile.number': 'mobileNumber',
    'whatsapp.dialCode': 'whatsappDialCode', 'whatsapp.number': 'whatsappNumber', website: 'website',
    'address.recipient': 'addressRecipient', 'address.line1': 'addressLine1',
    'address.line2': 'addressLine2', 'address.city': 'addressCity',
    'address.region': 'addressRegion', 'address.postalCode': 'addressPostalCode',
    'address.country': 'addressCountry', company: 'company',
    ...Object.fromEntries(socialPlatforms.map((platform) => [`socials.${platform}`, platform])),
  };
  const errors: AccountFieldErrors = {};
  for (const issue of error.issues) {
    const name = names[issue.path.join('.')];
    if (name && !errors[name]) errors[name] = issue.message;
  }
  return errors;
}

export type AccountProfile = z.infer<typeof accountProfileSchema>;
export type AccountActionState = { error?: string; success?: string; fieldErrors?: AccountFieldErrors };

export const emptyProfile: AccountProfile = {
  displayName: '', mobile: { dialCode: '', number: '' },
  whatsappSameAsMobile: false, whatsapp: { dialCode: '', number: '' },
  website: '', address: { ...emptyAddress }, company: '',
  socials: { Instagram: '', Facebook: '', LinkedIn: '', X: '' },
};

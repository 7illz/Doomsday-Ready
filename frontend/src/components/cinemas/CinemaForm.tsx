import { useState, type FormEvent } from 'react';
import type { CreateCinemaRequest } from '../../api/client';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface CinemaFormProps {
  submitting: boolean;
  serverError?: string;
  onCancel: () => void;
  onSubmit: (values: CreateCinemaRequest) => Promise<void>;
}

interface CinemaFormErrors {
  name?: string;
  bundleSizes?: string;
}

export function validateCinemaForm(
  name: string,
  rawBundleSizes: readonly string[],
): CinemaFormErrors {
  const errors: CinemaFormErrors = {};
  if (name.trim().length === 0) errors.name = 'Cinema name is required.';
  if (rawBundleSizes.length < 1 || rawBundleSizes.length > 10) {
    errors.bundleSizes = 'Enter between 1 and 10 bundle sizes.';
    return errors;
  }

  const bundleSizes = rawBundleSizes.map(Number);
  if (
    rawBundleSizes.some((value) => !/^\d+$/.test(value)) ||
    bundleSizes.some((size) => !Number.isInteger(size) || size < 1 || size > 500)
  ) {
    errors.bundleSizes = 'Every bundle size must be a whole number from 1 to 500.';
  } else if (new Set(bundleSizes).size !== bundleSizes.length) {
    errors.bundleSizes = 'Bundle sizes must be distinct.';
  }
  return errors;
}

export function CinemaForm({
  submitting,
  serverError,
  onCancel,
  onSubmit,
}: CinemaFormProps) {
  const [name, setName] = useState('');
  const [bundleSizes, setBundleSizes] = useState(['']);
  const [errors, setErrors] = useState<CinemaFormErrors>({});

  function updateBundle(index: number, value: string) {
    setBundleSizes((current) =>
      current.map((bundle, bundleIndex) => (bundleIndex === index ? value : bundle)),
    );
    setErrors((current) => ({ ...current, bundleSizes: undefined }));
  }

  function removeBundle(index: number) {
    setBundleSizes((current) => current.filter((_, bundleIndex) => bundleIndex !== index));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    const nextErrors = validateCinemaForm(name, bundleSizes);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    await onSubmit({
      name: name.trim(),
      bundleSizes: bundleSizes.map(Number),
    });
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit} noValidate>
      {serverError && (
        <div role="alert" className="rounded-xl border border-red-400/25 bg-red-500/[0.08] px-4 py-3 text-sm leading-6 text-red-200">
          {serverError}
        </div>
      )}
      <Input
        label="Cinema name"
        value={name}
        onChange={(event) => {
          setName(event.target.value);
          setErrors((current) => ({ ...current, name: undefined }));
        }}
        error={errors.name}
        maxLength={150}
        autoComplete="off"
        placeholder="e.g. Cinema E"
      />

      <fieldset>
        <div className="flex items-end justify-between gap-4">
          <div>
            <legend className="text-sm font-medium text-zinc-200">Seat bundle sizes</legend>
            <p className="mt-1 text-sm text-zinc-500">Add 1–10 distinct sizes, each from 1–500 seats.</p>
          </div>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setBundleSizes((current) => [...current, ''])}
            disabled={bundleSizes.length >= 10 || submitting}
          >
            Add size
          </Button>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {bundleSizes.map((value, index) => (
            <div key={index} className="flex items-end gap-2">
              <Input
                label={`Bundle size ${index + 1}`}
                type="number"
                inputMode="numeric"
                min="1"
                max="500"
                step="1"
                value={value}
                onChange={(event) => updateBundle(index, event.target.value)}
                className="tabular-nums"
              />
              {bundleSizes.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={`Remove bundle size ${index + 1}`}
                  onClick={() => removeBundle(index)}
                  disabled={submitting}
                  className="mb-0.5"
                >
                  Remove
                </Button>
              )}
            </div>
          ))}
        </div>
        {errors.bundleSizes && (
          <p role="alert" className="mt-3 text-sm text-red-300">{errors.bundleSizes}</p>
        )}
      </fieldset>

      <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
        <Button variant="ghost" onClick={onCancel} disabled={submitting}>Cancel</Button>
        <Button type="submit" loading={submitting}>Create cinema</Button>
      </div>
    </form>
  );
}

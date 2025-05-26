import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { FormField } from '../lib/api/events';
import { validateForm } from '../lib/utils/validation';

interface UseRegistrationFormProps {
  fields: FormField[];
  onSubmit: (data: Record<string, any>) => Promise<void>;
}

export const useRegistrationForm = ({ fields, onSubmit }: UseRegistrationFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm();

  const handleFormSubmit = async (data: Record<string, any>) => {
    try {
      setIsSubmitting(true);
      setSubmitError(null);

      // Validate form
      const validationErrors = validateForm(fields, data);
      if (Object.keys(validationErrors).length > 0) {
        Object.entries(validationErrors).forEach(([field, message]) => {
          setError(field, { message });
        });
        return;
      }

      await onSubmit(data);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    register,
    handleSubmit: handleSubmit(handleFormSubmit),
    errors,
    isSubmitting,
    submitError,
  };
}; 
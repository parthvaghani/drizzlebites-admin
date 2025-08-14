import { HTMLAttributes } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from '@tanstack/react-router';
// import { IconBrandFacebook, IconBrandGithub } from '@tabler/icons-react';
import { cn } from '@/lib/utils';
// import { useRouter } from '@tanstack/react-router' // Removed useRouter
// import { jwtDecode } from 'jwt-decode'
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/password-input';
import { handleServerError } from '@/utils/handle-server-error';
import { useLogin } from '@/hooks/use-auth';
// import { toast } from 'sonner' // Removed toast as it's handled in useLogin

type UserAuthFormProps = HTMLAttributes<HTMLFormElement>;

const formSchema = z.object({
  emailOrUsername: z
    .string()
    .min(1, 'Please enter your email or username')
    .refine((value) => {
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      const isUsername =
        value.length >= 3 && /^[a-zA-Z0-9_ ]+$/.test(value); // ✅ allows spaces in username
      return isEmail || isUsername;
    }, 'Please enter a valid email or username (minimum 3 characters)'),

  password: z
    .string()
    .min(1, 'Please enter your password')
    .min(7, 'Password must be at least 7 characters long'),
});

export function UserAuthForm({ className, ...props }: UserAuthFormProps) {

  const loginMutation = useLogin();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      emailOrUsername: '',
      password: '',
    },
  });


  async function onSubmit(data: z.infer<typeof formSchema>) {
    try {
      const finalData = { ...data }; // Removed role: 'user' as const

      await loginMutation.mutateAsync(finalData); // Removed direct response handling and cookie setting

      // No need for cookie setting or success toast here, it's handled in useLogin
      // No need for router.navigate here, it's handled in useLogin

    } catch (error) {
      handleServerError(error);
    }
  }
  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn('grid gap-3', className)}
        {...props}
      >
        <FormField
          control={form.control}
          name='emailOrUsername'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email or Username</FormLabel>
              <FormControl>
                <Input placeholder='Enter your email or username' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='password'
          render={({ field }) => (
            <FormItem className='relative'>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <PasswordInput placeholder='********' {...field} />
              </FormControl>
              <FormMessage />
              <Link
                to='/forgot-password'
                className='text-muted-foreground absolute -top-0.5 right-0 text-sm font-medium hover:opacity-75'
              >
                Forgot password?
              </Link>
            </FormItem>
          )}
        />
        <Button
          className="mt-2"
          disabled={loginMutation.isPending}
          type="submit"
        >
          {loginMutation.isPending ? 'Logging in...' : 'Login'}
        </Button>

        <div className='relative my-2'>
          <div className='absolute inset-0 flex items-center'>
            <span className='w-full border-t' />
          </div>
          <div className='relative flex justify-center text-xs uppercase'>
            <span className='bg-background text-muted-foreground px-2'>
              Or
            </span>
          </div>
        </div>

        {/* <div className='grid grid-cols-2 gap-2'>
          <Button variant='outline' type='button' disabled={loginMutation.isPending}>
            <IconBrandGithub className='h-4 w-4' /> GitHub
          </Button>
          <Button variant='outline' type='button' disabled={loginMutation.isPending}>
            <IconBrandFacebook className='h-4 w-4' /> Facebook
          </Button>
        </div> */}
      </form>
    </Form>
  );
}

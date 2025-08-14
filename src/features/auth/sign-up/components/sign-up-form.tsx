// import { HTMLAttributes } from 'react'
// import { z } from 'zod'
// import Cookies from 'js-cookie'
// import { useForm } from 'react-hook-form'
// import { zodResolver } from '@hookform/resolvers/zod'
// import { useRouter } from '@tanstack/react-router'
// // import { jwtDecode } from 'jwt-decode'
// import { toast } from 'sonner'
// // import { useAuthStore } from '@/stores/authStore'
// import { cn } from '@/lib/utils'
// import { handleServerError } from '@/utils/handle-server-error'
// import { useRegister } from '@/hooks/use-auth'
// import { Button } from '@/components/ui/button'
// import { Checkbox } from '@/components/ui/checkbox'
// import {
//   Form,
//   FormControl,
//   FormField,
//   FormItem,
//   FormLabel,
//   FormMessage,
// } from '@/components/ui/form'
// import { Input } from '@/components/ui/input'
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from '@/components/ui/select'
// import { PasswordInput } from '@/components/password-input'

// // interface AuthUser {
// //   accountNo: string
// //   email: string
// //   role: string[]
// //   exp: number
// // }

// type SignUpFormProps = HTMLAttributes<HTMLFormElement>

// // ✅ Zod Validation Schema
// const formSchema = z
//   .object({
//     email: z.string().trim().email('Please enter a valid email address'),
//     phoneNumber: z.string().min(8, 'Phone number must be at least 8 digits'),
//     password: z
//       .string()
//       .min(6, 'Password must be at least 6 characters long')
//       .regex(
//         /^(?=.*[A-Za-z])(?=.*\d)/,
//         'Password must contain at least one letter and one number'
//       ),
//     confirmPassword: z.string().min(1, 'Please confirm your password'),
//     user_details: z.object({
//       name: z.string().trim().min(1, 'Name is required'),
//       country: z.string().trim().min(1, 'Country is required'),
//       gender: z
//         .enum(['Male', 'Female', 'Other'])
//         .refine((val) => val !== undefined, {
//           message: 'Please select a gender',
//         }),
//     }),
//     acceptedTerms: z.boolean().refine((val) => val === true, {
//       message: 'You must accept the terms and conditions',
//     }),
//   })
//   .refine((data) => data.password === data.confirmPassword, {
//     message: "Passwords don't match",
//     path: ['confirmPassword'],
//   })

// export function SignUpForm({ className, ...props }: SignUpFormProps) {
//   const registerMutation = useRegister()
//   const router = useRouter()
//   // const setAccessToken = useAuthStore((state) => state.auth.setAccessToken)
//   // const setUser = useAuthStore((state) => state.auth.setUser)

//   const form = useForm<z.infer<typeof formSchema>>({
//     resolver: zodResolver(formSchema),
//     mode: 'onBlur',
//     defaultValues: {
//       email: '',
//       phoneNumber: '',
//       password: '',
//       confirmPassword: '',
//       user_details: {
//         name: '',
//         country: '',
//         gender: undefined,
//       },
//       acceptedTerms: false,
//     },
//   })

//   // ✅ Handle Form Submission
//   async function onSubmit(data: z.infer<typeof formSchema>) {
//     try {
//       const { confirmPassword, ...registerData } = data
//       const finalData = { ...registerData, role: 'user' as const }

//       const response = await registerMutation.mutateAsync(finalData)
//       if (!response?.tokens)
//         throw new Error('Sign-up failed. No token received.')

//       const accessToken = String(response.tokens.access.token)

//       // Store in cookie with proper configuration
//       const isProduction = process.env.NODE_ENV === 'production'
//       const cookieOptions = {
//         path: '/',
//         expires: 7, // 7 days
//         sameSite: 'lax' as const,
//         secure: isProduction,
//         domain: undefined,
//       }

//       // Set the cookie
//       Cookies.set('session', accessToken, cookieOptions)

//       // Verify cookie was set
//       const storedCookie = Cookies.get('session')
//       if (!storedCookie) {
//         toast.error('Failed to store session. Please try again.')
//         return
//       }

//       toast.success('Account created successfully!')
//       router.navigate({ to: '/' })
//     } catch (error) {
//       handleServerError(error)
//     }
//   }

//   return (
//     <Form {...form}>
//       <form
//         onSubmit={form.handleSubmit(onSubmit)}
//         className={cn('grid gap-3', className)}
//         {...props}
//       >
//         {/* Email */}
//         <FormField
//           control={form.control}
//           name='email'
//           render={({ field }) => (
//             <FormItem>
//               <FormLabel>Email</FormLabel>
//               <FormControl>
//                 <Input placeholder='name@example.com' {...field} />
//               </FormControl>
//               <FormMessage />
//             </FormItem>
//           )}
//         />

//         {/* Phone */}
//         <FormField
//           control={form.control}
//           name='phoneNumber'
//           render={({ field }) => (
//             <FormItem>
//               <FormLabel>Phone Number</FormLabel>
//               <FormControl>
//                 <Input placeholder='+1234567890' {...field} />
//               </FormControl>
//               <FormMessage />
//             </FormItem>
//           )}
//         />

//         {/* Full Name */}
//         <FormField
//           control={form.control}
//           name='user_details.name'
//           render={({ field }) => (
//             <FormItem>
//               <FormLabel>Full Name</FormLabel>
//               <FormControl>
//                 <Input placeholder='Enter your full name' {...field} />
//               </FormControl>
//               <FormMessage />
//             </FormItem>
//           )}
//         />

//         {/* Country */}
//         <FormField
//           control={form.control}
//           name='user_details.country'
//           render={({ field }) => (
//             <FormItem>
//               <FormLabel>Country</FormLabel>
//               <FormControl>
//                 <Input placeholder='Enter your country' {...field} />
//               </FormControl>
//               <FormMessage />
//             </FormItem>
//           )}
//         />

//         {/* Gender */}
//         <FormField
//           control={form.control}
//           name='user_details.gender'
//           render={({ field }) => (
//             <FormItem>
//               <FormLabel>Gender</FormLabel>
//               <Select onValueChange={field.onChange} defaultValue={field.value}>
//                 <FormControl>
//                   <SelectTrigger>
//                     <SelectValue placeholder='Select gender' />
//                   </SelectTrigger>
//                 </FormControl>
//                 <SelectContent>
//                   <SelectItem value='Male'>Male</SelectItem>
//                   <SelectItem value='Female'>Female</SelectItem>
//                   <SelectItem value='Other'>Other</SelectItem>
//                 </SelectContent>
//               </Select>
//               <FormMessage />
//             </FormItem>
//           )}
//         />

//         {/* Password */}
//         <FormField
//           control={form.control}
//           name='password'
//           render={({ field }) => (
//             <FormItem>
//               <FormLabel>Password</FormLabel>
//               <FormControl>
//                 <PasswordInput placeholder='********' {...field} />
//               </FormControl>
//               <FormMessage />
//             </FormItem>
//           )}
//         />

//         {/* Confirm Password */}
//         <FormField
//           control={form.control}
//           name='confirmPassword'
//           render={({ field }) => (
//             <FormItem>
//               <FormLabel>Confirm Password</FormLabel>
//               <FormControl>
//                 <PasswordInput placeholder='********' {...field} />
//               </FormControl>
//               <FormMessage />
//             </FormItem>
//           )}
//         />

//         {/* Terms */}
//         <FormField
//           control={form.control}
//           name='acceptedTerms'
//           render={({ field }) => (
//             <FormItem className='flex flex-row items-start space-x-3'>
//               <FormControl>
//                 <Checkbox
//                   checked={field.value}
//                   onCheckedChange={field.onChange}
//                 />
//               </FormControl>
//               <div className='space-y-1 leading-none'>
//                 <FormLabel>
//                   I accept the{' '}
//                   <a href='/terms' className='hover:text-primary underline'>
//                     Terms
//                   </a>{' '}
//                   and{' '}
//                   <a href='/privacy' className='hover:text-primary underline'>
//                     Privacy Policy
//                   </a>
//                 </FormLabel>
//                 <FormMessage />
//               </div>
//             </FormItem>
//           )}
//         />

//         {/* Submit */}
//         <Button className='mt-2' disabled={registerMutation.isPending}>
//           {registerMutation.isPending
//             ? 'Creating account...'
//             : 'Create Account'}
//         </Button>
//       </form>
//     </Form>
//   )
// }

import { SignupForm } from 'wasp/client/auth';
import { Link } from 'wasp/client/router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { useTheme } from '../../hooks/use-theme';

export function Signup() {
  const { colors } = useTheme();

  return (
    <div className='flex items-center justify-center min-h-screen bg-primary-foreground'>
      <Card className='w-full max-w-md'>
        <CardHeader>
          <CardTitle>Create Account</CardTitle>
          <CardDescription>Enter your information to create a new account</CardDescription>
        </CardHeader>
        <CardContent>
          <SignupForm
            appearance={{
              colors,
            }}
          />
          <div className="mt-4 text-center text-sm">
            Already have an account?{' '}
            <Link to="/login" className="underline">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

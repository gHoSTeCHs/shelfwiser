import AuthLayout from '@/layouts/AuthPageLayout.tsx';
import SignInForm from '../../components/auth/SignInForm';

export default function SignIn() {
    return (
        <>
            <AuthLayout>
                <SignInForm />
            </AuthLayout>
        </>
    );
}

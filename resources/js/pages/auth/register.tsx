import AuthLayout from '@/layouts/AuthPageLayout.tsx';
import SignUpForm from '../../components/auth/SignUpForm';

export default function SignUp() {
    return (
        <>
            <AuthLayout>
                <SignUpForm />
            </AuthLayout>
        </>
    );
}

import { useAuth } from "../lib/auth";

function HomePage() {
    const auth = useAuth();
    return <div>Welcome to {auth.user ? auth.user.name : 'GUEST'}!</div>
}

export default HomePage

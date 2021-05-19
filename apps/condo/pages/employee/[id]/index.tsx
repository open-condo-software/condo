import { useRouter } from 'next/router'

const Employee = () => {
    const router = useRouter()
    const { query: { id } } = router
    console.log(id)

    return (
        <div>
            Employee
        </div>
    )
}

export default Employee
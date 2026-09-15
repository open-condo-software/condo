import { OrganizationCard } from '@/domains/organization/components/OrganizationCard'
import { ResidentCard } from '@/domains/resident/components/ResidentCard'
import { useAuth } from '@/domains/user/components/AuthContext'
import { UserCard } from '@/domains/user/components/UserCard'

import styles from './index.module.css'

import { UserTypeType } from '@/gql'


export default function Home () {
    const { user } = useAuth()

    return (
        <>
            <div
                className={styles.cardsContainer}
            >
                <UserCard/>
                {user?.type === UserTypeType.Staff && <OrganizationCard/>}
                {user?.type === UserTypeType.Resident && <ResidentCard/>}
            </div>
        </>
    )
}

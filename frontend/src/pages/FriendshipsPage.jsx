import SearchPlayerByUsername from "../components/playerSearch/SearchPlayerByUsername";
import MainLayout from "../layout/MainLayout";

export default function FriendshipsPage() {

    return (
        <MainLayout>
            <div className="w-full max-w-3xl mx-auto space-y-6">
                <div className="w-full max-w-xl mx-auto">
                    <SearchPlayerByUsername/>
                </div>
            </div>
        </MainLayout>
    )
}
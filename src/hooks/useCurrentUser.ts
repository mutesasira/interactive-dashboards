import { useQuery } from "@tanstack/react-query";
import { useDataEngine } from "@dhis2/app-runtime";

interface CurrentUser {
    id: string;
    name: string;
    displayName: string;
    firstName?: string;
    surname?: string;
    username: string;
}

const query = {
    me: {
        resource: "me",
        params: {
            fields: "id,name,displayName,firstName,surname,username"
        }
    }
};

export const useCurrentUser = () => {
    const engine = useDataEngine();
    
    return useQuery<CurrentUser>({
        queryKey: ["currentUser"],
        queryFn: async () => {
            const { me }: any = await engine.query(query);
            return me;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
        cacheTime: 30 * 60 * 1000, // 30 minutes
    });
};
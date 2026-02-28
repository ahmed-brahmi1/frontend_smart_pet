export interface MenuItem {
    id?: number;
    label?: any;
    title?:string;
    role?:string;   
    icon?: string;
    link?: string;
    path?: string;
    subItems?: any;
    isTitle?: boolean;
    badge?: any;
    parentId?: number;
    isLayout?: boolean;
}
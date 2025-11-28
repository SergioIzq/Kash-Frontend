export interface ErrorResponse
{
    code:string;
    title: string;
    detail: string;
    traceId?: string;
    timestamp: Date;
}
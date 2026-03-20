export interface ProcessedOrg {
  content: any
}

export const processOrg = async (content: string): Promise<ProcessedOrg> => {
  return { content }
}
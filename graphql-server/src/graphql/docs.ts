import { getNotionPageById } from '../notion/index.js';

const DocsDefinitions = `
" Documentation marketing pages for bam "
type Documentation {
  " The id corresponding to an equivalent notion page "
  id: ID

  " All the text in the document "
  text: String
}
`

const DocsQueriesDefinitions = `
" Get documentation "
getDocumentation(
  " Get documentation by its id "
  id: ID!
):Documentation
`

const DocsQueries = {
  async getDocumentation(root: any, { id }: { id: string }, context: any) {
    const data = await getNotionPageById(id);
    return {
      id,
      text: JSON.stringify(data),
    };
  },
}

export {
  DocsDefinitions,
  DocsQueriesDefinitions,
  DocsQueries,
}
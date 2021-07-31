import { GetStaticPaths, GetStaticProps } from 'next'

import Article, { Props as ArticleProps } from '../components/Article'
import getQueryParameter from '../util/getQueryParameters'
import loadAllRecords from '../util/loadAllRecords'
import loadMarkdownFile from '../util/loadMarkdownFile'
import loadRecordCollections from '../util/loadRecordCollections'
import omitUndefinedFields from '../util/omitUndefinedFields'
import serializeMdxSource from '../util/serializeMdxSource'
import slugToTitleCase from '../util/slugToTitleCase'

export const getStaticPaths: GetStaticPaths = async () => {
    const posts = await loadAllRecords('posts', true)
    const paths = posts.map(post => ({ params: { slug: post.slug } }))
    return {
        paths,
        fallback: false,
    }
}

export const getStaticProps: GetStaticProps<ArticleProps> = async context => {
    const slug = getQueryParameter(context.params, 'slug')
    const baseDirectory = 'posts'
    const markdownFile = await loadMarkdownFile(baseDirectory, `${slug}.md`)
    const { serializeResult, toc } = await serializeMdxSource(markdownFile)
    const collections = await loadRecordCollections('posts')
    const { recordCollections } = collections
    const parentCollection = recordCollections.find(collection => !!collection.members.find(member => member.slug === slug))
    const recordAuthorId = markdownFile.frontMatter.author ?? null
    const recordAuthor = recordAuthorId ? slugToTitleCase(recordAuthorId) : null
    return {
        props: omitUndefinedFields({
            title: markdownFile.frontMatter.title,
            alternateTitle: markdownFile.frontMatter.alternateTitle,
            author: recordAuthor,
            authorId: recordAuthorId,
            tags: markdownFile.frontMatter.tags,
            image: markdownFile.frontMatter.image,
            imageAlt: markdownFile.frontMatter.imageAlt,
            socialImage: markdownFile.frontMatter.socialImage,
            description: markdownFile.frontMatter.description,
            toc,
            mdxSource: serializeResult,
            collection: parentCollection ?? null,
            slug,
        }),
    }
}

export default Article

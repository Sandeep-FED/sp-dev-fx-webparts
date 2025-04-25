import {
  Avatar,
  Button,
  Card,
  Divider,
  Image,
  makeStyles,
  Spinner,
  Text,
  Textarea,
} from "@fluentui/react-components"
import * as React from "react"
import { useEffect } from "react"
import {
  addNewComment,
  deleteComment,
  getPosts,
  updateCommentLikeDislike,
  updatePostLikeDislike,
} from "../services/SPService"
import styles from "../ReactEngageHub.module.scss"
import {
  bundleIcon,
  DeleteFilled,
  DeleteRegular,
  Heart20Color,
  Heart20Regular,
  Send16Color,
} from "@fluentui/react-icons"
import { LOADMOREPOSTSLABEL, LOADPOSTSLABEL } from "../../constants/constants"
import { ImagePreview } from "./ImagePreview"
import { WEBPARTCONTEXT } from "../../context/webPartContext"
import { IReactEngageHubProps } from "../IReactEngageHubProps"
import { DeletePostButton } from "./DeletePostButton"

export interface IPostsProps {}

const ThumbLike = bundleIcon(Heart20Color, Heart20Regular)
const Delete = bundleIcon(DeleteFilled, DeleteRegular)

const useStyles = makeStyles({
  newCommentBtn: {
    position: "absolute",
    right: "0",
    bottom: "0",
    marginRight: "0.5rem",
    marginBottom: "0.5rem",
  },
  newcommentTextarea: {
    width: "100%",
    position: "relative",
  },
  image: {
    width: "inherit",
    height: "inherit",
    borderRadius: "8px",
    "&:hover": {
      cursor: "pointer",
    },
  },
  postCardWrapper: {
    overflowY: "auto",
    paddingTop: "0.25rem",
    height: "350px",
    paddingBottom: "3rem",
  },
  card: {
    marginBottom: "0.75rem",
  },
  noPostImage: {
    width: "350px",
    marginLeft: "auto",
    marginRight: "auto",
    marginTop: "5rem",
  },
})
export const Posts = ({ refreshTrigger }: any) => {
  const [posts, setPosts] = React.useState<any>([])
  const [newComments, setNewComments] = React.useState<{
    [key: number]: string
  }>({})
  const [nextLink, setNextLink] = React.useState<string | undefined>()
  const [hasMore, setHasMore] = React.useState<boolean>(true)
  const [isLoading, setIsLoading] = React.useState<boolean>(true)
  const [isLoaderRef, setLoaderRef] = React.useState<boolean>(false)
  const { context, isDarkTheme } =
    React.useContext<IReactEngageHubProps>(WEBPARTCONTEXT)

  const fluentStyles = useStyles()

  const loaderRef = React.useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    fetchPosts()
  }, [refreshTrigger])

  useEffect(() => {
    const current = loaderRef.current

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0]
        if (first.isIntersecting && hasMore && nextLink) {
          fetchMorePosts()
        }
      },
      { threshold: 1.0 }
    )

    if (current) {
      observer.observe(current)
    }

    return () => {
      if (current) observer.unobserve(current)
    }
  }, [isLoaderRef, hasMore, nextLink])

  const onClickCommentLikeBtn = async (
    postId: number,
    commentId: string,
    isLikedByUser: boolean
  ) => {
    await updateCommentLikeDislike(postId, commentId, isLikedByUser)
    await fetchPosts()
  }

  const onClickPostLikeBtn = async (postId: number, postLike: boolean) => {
    await updatePostLikeDislike(postId, postLike)
    await fetchPosts()
  }

  const onClickNewCommentBtn = async (postId: number) => {
    await addNewComment(postId, newComments[postId])
    setNewComments({ ...newComments, [postId]: "" })
    await fetchPosts()
  }

  const handleNewCommentChange = (postId: number, value: string) => {
    setNewComments({ ...newComments, [postId]: value })
  }

  const onClickDeleteCommentBtn = async (postID: number, commentID: string) => {
    await deleteComment(postID, commentID)
    await fetchPosts()
  }

  const fetchPosts = async () => {
    setIsLoading(true)
    const data = await getPosts(context)
    setPosts(data.items)
    setHasMore(data.hasMore)
    setNextLink(data.nextLink)
    setIsLoading(false)
  }

  const fetchMorePosts = async () => {
    if (!nextLink || !hasMore) return

    try {
      const response = await getPosts(context, nextLink)

      // Only add new items if we get them
      if (response.items && response.items.length > 0) {
        setPosts((prev: any) => [...prev, ...response.items])
        setHasMore(response.hasMore)
        setNextLink(response.nextLink)
      } else {
        // No more items to load
        setHasMore(false)
        setNextLink(undefined)
      }
    } catch (error) {
      setHasMore(false)
      setNextLink(undefined)
    }
  }

  if (isLoading) {
    return <Spinner size='medium' label={LOADPOSTSLABEL} />
  }

  if (posts.length === 0) {
    return (
      <Image
        className={fluentStyles.noPostImage}
        src={require("../assets/nopost.png")}
        alt='No posts found'
      />
    )
  }
  return (
    <>
      <Text size={300} weight='semibold'>
        Recent Posts
      </Text>
      <div className={fluentStyles.postCardWrapper}>
        {posts &&
          posts.map((post: any) => (
            <Card className={fluentStyles.card}>
              <article key={post.ID} className={styles.article}>
                <div className={styles.avatar}>
                  <Avatar name={post.AuthorName} size={36} />
                  <div className={styles.author}>
                    <Text>{post.AuthorName}</Text>
                    <Text size={100}>
                      {new Date(post.Created).toLocaleString("en-IN")}
                    </Text>
                  </div>
                  <div
                    className={styles.likeContainer}
                    style={{
                      marginLeft: "auto",
                      padding: "0 18px 0 4px",
                      height: "28px",
                    }}
                  >
                    <Button
                      appearance='transparent'
                      icon={
                        <ThumbLike
                          filled={post.isLiked}
                          style={post.isLiked ? { color: "red" } : {}}
                        />
                      }
                      onClick={() => onClickPostLikeBtn(post.ID, post.isLiked)}
                    />
                    <Text>
                      {post.LikesCount === null
                        ? 0
                        : Math.ceil(post.LikesCount)}
                    </Text>
                  </div>
                  {post.UserID ===
                    context.pageContext.legacyPageContext?.userPuid && (
                    <DeletePostButton
                      postId={post.PostID}
                      itemId={post.ID}
                      fetchPosts={fetchPosts}
                    />
                  )}
                </div>
                {post.Images.length > 0 && (
                  <div className={styles.imageContainer}>
                    {post.Images.map((image: string) => (
                      <div className={styles.previewImageWrapper}>
                        <ImagePreview preview={image} />
                      </div>
                    ))}
                  </div>
                )}
                <div
                  dangerouslySetInnerHTML={{
                    __html: post.Description,
                  }}
                ></div>
                <Divider style={{ paddingTop: "1rem" }} />
                {post.comments.map((comment: any) => (
                  <section>
                    <div
                      className={styles.commentArea}
                      style={{
                        backgroundColor: isDarkTheme ? "#2b2b2b" : "#f7f7f7",
                      }}
                    >
                      <div className={styles.avatar}>
                        <Avatar
                          name={comment.author.name}
                          size={36}
                          active={
                            comment.author.isActive ? "active" : "inactive"
                          }
                          badge={
                            comment.author.isActive
                              ? { status: "available" }
                              : { status: "offline" }
                          }
                        />
                        <div className={styles.author}>
                          <Text>{comment.author.name}</Text>
                          <Text size={100}>
                            {new Date(comment.createdDate).toLocaleString(
                              "en-IN"
                            )}
                          </Text>
                        </div>
                      </div>
                      <Text>{comment.text}</Text>
                      <div className={styles.reactions}>
                        <div className={styles.likeContainer}>
                          <Button
                            appearance='transparent'
                            icon={
                              <ThumbLike
                                filled={comment.isLikedByUser}
                                style={
                                  comment.isLikedByUser ? { color: "red" } : {}
                                }
                              />
                            }
                            onClick={() =>
                              onClickCommentLikeBtn(
                                post.ID,
                                comment.id,
                                comment.isLikedByUser
                              )
                            }
                          />
                          <Text>{comment.likeCount}</Text>
                        </div>
                        <Button
                          appearance='transparent'
                          icon={<Delete />}
                          onClick={() =>
                            onClickDeleteCommentBtn(post.ID, comment.id)
                          }
                        />
                      </div>
                    </div>
                  </section>
                ))}
                <div className={styles.newCommentContainer}>
                  <Textarea
                    className={fluentStyles.newcommentTextarea}
                    onChange={(e) =>
                      handleNewCommentChange(post.ID, e.target.value)
                    }
                    value={newComments[post.ID] || ""}
                    size='small'
                    placeholder='Add a comment'
                  />
                  <Button
                    appearance='transparent'
                    icon={<Send16Color />}
                    onClick={() => onClickNewCommentBtn(post.ID)}
                    className={fluentStyles.newCommentBtn}
                  />
                </div>
              </article>
            </Card>
          ))}
        {hasMore && nextLink && (
          <div
            ref={(el) => {
              loaderRef.current = el
              setLoaderRef((el) => !el)
            }}
          >
            <Spinner size='tiny' label={LOADMOREPOSTSLABEL} />
          </div>
        )}
      </div>
    </>
  )
}

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import baseUrl from "../utils/baseUrl";
import { parseCookies } from "nookies";
import { NoProfile, NoProfilePosts } from "../components/Layout/NoData";
import cookie from "js-cookie";
import { Grid } from "semantic-ui-react";
import ProfileMenuTabs from "../components/Profile/ProfileMenuTabs";
import ProfileHeader from "../components/Profile/ProfileHeader";
import CardPost from "../components/Post/CardPost";
import {
  PlaceHolderPosts,
  EndMessage,
} from "../components/Layout/PlaceHolderGroup";
import { PostDeleteToastr } from "../components/Layout/Toastr";
import Followers from "../components/Profile/Followers";
import Following from "../components/Profile/Following";
import UpdateProfile from "../components/Profile/UpdateProfile";
import Settings from "../components/Profile/Settings";

import io from "socket.io-client";

// for scroll post
import InfiniteScroll from "react-infinite-scroll-component";

// dynamic api routes => only for api folder inside pages folder
function ProfilePage({
  profile,
  followersLength,
  followingLength,
  errorLoading,
  user,
  userFollowStats,
}) {
  // recieving user, userFollowStats from app.js
  const router = useRouter();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);

  const [activeItem, setActiveItem] = useState("profile");

  const handleItemClick = (item) => setActiveItem(item);

  const [loggedUserFollowStats, setUserFollowStats] = useState(userFollowStats);

  const ownAccount = profile.user._id === user._id; // viewing his own account

  const [showToastr, setShowToastr] = useState(false);

  if (errorLoading) return <NoProfile />; // profile not found

  const socket = useRef();

  // for infinite scroll
  const [hasMore, setHasMore] = useState(true);
  const [pageNumber, setPageNumber] = useState(1);

  useEffect(() => {
    if (!socket.current) {
      socket.current = io(baseUrl); // connecting to server by calling io with baseUrl
    }

    if (socket.current) {
      socket.current.emit("join", { userId: user._id });
    }

    return () => {
      if (socket.current) {
        socket.current.emit("disconnect");
        socket.current.off();
      }
    };
  }, []);

  // useEffect(() => {
  //   const getPosts = async () => {
  //     setLoading(true);
  //     try {
  //       const { username } = router.query;
  //       const token = cookie.get("token");

  //       const res = await axios.get(
  //         `${baseUrl}/api/profile/posts/${username}`,
  //         { headers: { Authorization: token } }
  //       );
  //       // console.log(res.data);
  //       setPosts(res.data);
  //     } catch (error) {
  //       alert(`Error Loading Posts`);
  //     }
  //     setLoading(false);
  //   };
  //   getPosts();
  // }, [router.query.username]);

  useEffect(() => {
    const getPosts = async () => {
      setLoading(true);
      try {
        const { username } = router.query;
        const token = cookie.get("token");

        const res = await axios.get(
          `${baseUrl}/api/profile/postsByScroll/${username}`,
          { headers: { Authorization: token }, params: { pageNumber } }
        );
        // console.log(res.data);
        setPosts(res.data);
        setPageNumber((prev) => prev + 1);
      } catch (error) {
        alert(`Error Loading Posts`);
      }
      setLoading(false);
    };
    getPosts();
  }, [router.query.username]);

  useEffect(() => {
    showToastr && setTimeout(() => setShowToastr(false), 3000);
  }, [showToastr]);

  const fetchDataOnScroll = async () => {
    try {
      const { username } = router.query;
      const token = cookie.get("token");
      const res = await axios.get(
        `${baseUrl}/api/profile/postsByScroll/${username}`,
        { headers: { Authorization: token }, params: { pageNumber } }
      );

      if (res.data.length === 0) setHasMore(false);
      setPosts((prev) => [...prev, ...res.data]);
      setPageNumber((prev) => prev + 1);
    } catch (error) {
      alert(`Error fetching Posts`);
    }
  };

  // const { username, pageNumber } = router.query; // from [username].js... localhost:3000/janedoe?pageNumber=2

  return (
    <>
      {showToastr && <PostDeleteToastr />}
      <Grid stackable>
        <Grid.Row>
          <Grid.Column>
            <ProfileMenuTabs
              activeItem={activeItem}
              handleItemClick={handleItemClick}
              followersLength={followersLength}
              followingLength={followingLength}
              ownAccount={ownAccount}
              loggedUserFollowStats={loggedUserFollowStats}
            />
          </Grid.Column>
        </Grid.Row>

        <Grid.Row>
          <Grid.Column>
            {activeItem === "profile" && (
              <>
                <ProfileHeader
                  profile={profile}
                  ownAccount={ownAccount}
                  loggedUserFollowStats={loggedUserFollowStats}
                  setUserFollowStats={setUserFollowStats}
                />

                {loading ? (
                  <PlaceHolderPosts />
                ) : posts.length > 0 ? (
                  <InfiniteScroll
                    hasMore={hasMore}
                    next={fetchDataOnScroll}
                    loader={<PlaceHolderPosts />}
                    endMessage={<EndMessage />}
                    dataLength={posts.length}
                  >
                    {posts.map((post) => (
                      <CardPost
                        key={post._id}
                        post={post}
                        user={user}
                        setPosts={setPosts}
                        setShowToastr={setShowToastr}
                      />
                    ))}
                  </InfiniteScroll>
                ) : (
                  <NoProfilePosts />
                )}
              </>
            )}

            {activeItem === "followers" && (
              <Followers
                user={user}
                loggedUserFollowStats={loggedUserFollowStats}
                setUserFollowStats={setUserFollowStats}
                profileUserId={profile.user._id}
                socket={socket}
              />
            )}

            {activeItem === "following" && (
              <Following
                user={user}
                loggedUserFollowStats={loggedUserFollowStats}
                setUserFollowStats={setUserFollowStats}
                profileUserId={profile.user._id}
                socket={socket}
              />
            )}

            {activeItem === "updateProfile" && (
              <UpdateProfile Profile={profile} />
            )}
            {activeItem === "settings" && (
              <Settings newMessagePopup={user.newMessagePopup} />
            )}
          </Grid.Column>
        </Grid.Row>
      </Grid>
    </>
  );
}

ProfilePage.getInitialProps = async (ctx) => {
  try {
    const { username } = ctx.query; // http://localhost:3000/?name=biglol  => name=biglol
    const { token } = parseCookies(ctx);

    const res = await axios.get(`${baseUrl}/api/profile/${username}`, {
      headers: { Authorization: token },
    });

    const { profile, followersLength, followingLength } = res.data;

    return { profile, followersLength, followingLength };
  } catch (error) {
    return { errorLoading: true };
  }
};

export default ProfilePage;

{
  /* <Route path="/post/:postId" component={Post}/> */
  // how to create smth like this? => pages -> post -> [postId].js
}

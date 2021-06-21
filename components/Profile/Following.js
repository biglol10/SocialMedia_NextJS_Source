import React, { useState, useEffect } from "react";
import { Button, Image, List } from "semantic-ui-react";
import Spinner from "../Layout/Spinner";
import axios from "axios";
import baseUrl from "../../utils/baseUrl";
import cookie from "js-cookie";
import { NoFollowData } from "../Layout/NoData";
import { followUser, unfollowUser } from "../../utils/profileActions";

function Following({
  user,
  loggedUserFollowStats,
  setUserFollowStats,
  profileUserId,
  socket,
}) {
  const [following, setFollowing] = useState([]);
  const [loading, setLoading] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    const getFollowing = async () => {
      setLoading(true);
      try {
        const res = await axios.get(
          `${baseUrl}/api/profile/following/${profileUserId}`,
          { headers: { Authorization: cookie.get("token") } }
        );
        setFollowing(res.data);
      } catch (error) {
        alert(`Error loading followers`);
      }
      setLoading(false);
    };
    getFollowing();
  }, []);

  const followUnfollowUser = async (
    userId,
    toSetuserFollowStats,
    fromUser,
    type
  ) => {
    if (type === "unfollowed") {
      await unfollowUser(userId, toSetuserFollowStats);
    } else {
      await followUser(userId, toSetuserFollowStats);
    }
    if (socket.current) {
      socket.current.emit("userFollowUnfollow", {
        userId,
        toSetuserFollowStats,
        fromUser,
        type,
      });
    }
  };

  return (
    <>
      {loading ? (
        <Spinner />
      ) : following.length > 0 ? (
        following.map((profileFollowing) => {
          const isFollowing =
            loggedUserFollowStats.following.length > 0 &&
            loggedUserFollowStats.following.filter(
              (following) => following.user === profileFollowing.user._id
            ).length > 0;
          return (
            <>
              <List
                key={profileFollowing.user._id}
                divided
                verticalAlign="middle"
              >
                <List.Item>
                  <List.Content floated="right">
                    {profileFollowing.user._id !== user._id && (
                      <Button
                        color={isFollowing ? "instagram" : "twitter"}
                        content={isFollowing ? "Following" : "Follow"}
                        icon={isFollowing ? "check" : "add user"}
                        disabled={followLoading}
                        onClick={async () => {
                          setFollowLoading(true);
                          isFollowing
                            ? await followUnfollowUser(
                                profileFollowing.user._id,
                                setUserFollowStats,
                                user,
                                "unfollowed"
                              )
                            : await followUnfollowUser(
                                profileFollowing.user._id,
                                setUserFollowStats,
                                user,
                                "followed"
                              );
                          setFollowLoading(false);
                        }}
                      />
                    )}
                  </List.Content>
                  <Image avatar src={profileFollowing.user.profilePicUrl} />
                  <List.Content
                    as="a"
                    href={`/${profileFollowing.user.username}`}
                  >
                    {profileFollowing.user.name}
                  </List.Content>
                </List.Item>
              </List>
            </>
          );
        })
      ) : (
        <NoFollowData followingComponent={true} />
      )}
    </>
  );
}

export default Following;

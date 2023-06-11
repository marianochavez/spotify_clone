"use client";

import { TbPlaylist } from "react-icons/tb";
import { AiOutlinePlus } from "react-icons/ai";

import MediaItem from "./MediaItem";
import useAuthModal from "@/hooks/useAuthModal";
import { useUser } from "@/hooks/useUser";
import useUploadModal from "@/hooks/useUploadModal";
import useOnPlay from "@/hooks/useOnPlay";
import useSubscribeModal from "@/hooks/useSubscribeModal";
import { Song } from "@/types";

type LibraryProps = {
  songs: Song[];
};

const Library = ({ songs }: LibraryProps) => {
  const { user, subscription } = useUser();
  const uploadmModal = useUploadModal();
  const authModal = useAuthModal();
  const subscribeModal = useSubscribeModal();

  const onPlay = useOnPlay(songs);

  const onClick = () => {
    if (!user) {
      return authModal.onOpen();
    }

    if (!subscription) {
      return subscribeModal.onOpen();
    }

    return uploadmModal.onOpen();
  };

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between px-5 pt-4">
        <div className="inline-flex items-center space-x-2">
          <TbPlaylist size={26} className="text-neutral-400" />
          <p className="text-neutral-400 font-medium text-md">Your Library</p>
        </div>
        <AiOutlinePlus
          onClick={onClick}
          size={20}
          className="text-neutral-400 cursor-pointer hover:text-white transition"
        />
      </div>
      <div className="flex flex-col space-y-2 my-4 px-3">
        {songs.map((song) => (
          <MediaItem
            key={song.id}
            onClick={(id: string) => onPlay(id)}
            data={song}
          />
        ))}
      </div>
    </div>
  );
};

export default Library;

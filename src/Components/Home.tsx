import React, {
  useState,
  useCallback,
  useRef,
  useEffect,
  useMemo,
} from "react";
import SoundDriver from "./SoundDriver";
import Button from "./Button/Button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlayCircle,
  faPauseCircle,
  faStop,
} from "@fortawesome/free-solid-svg-icons";
import "./Home.css";

const Home = () => {
  const soundController = useRef<undefined | SoundDriver>(undefined);
  const waveContainerRef = useRef<HTMLDivElement>(null);
  const volRef = useRef<number | undefined>(0);
  const timeRef = useRef<number | undefined>(0);
  const animationFrameRef = useRef<number | undefined>();
  const [volume, setVolume] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setLoading(true);
    setIsDragOver(false);

    const audioFile = e.dataTransfer.files[0];
    console.log("Загружен файл:", audioFile);
    if (!audioFile || !audioFile.type.includes("audio")) {
      throw new Error("Wrong audio file");
    }
    const soundInstance = new SoundDriver(audioFile);
    try {
      await soundInstance.init(document.getElementById("waveContainer"));
      soundController.current = soundInstance;
      console.log(soundController.current);
    } catch (err: any) {
      console.log(err);
    } finally {
      setLoading(false);
      soundInstance.drawChart();
    }
  }, []);

  const togglePlayer = useCallback((type: string) => {
    return () => {
      if (type === "play") {
        soundController.current?.play();
        const updateCurrentTime = () => {
          const currentTime = soundController.current?.getCurrentTime() || 0;
          soundController.current?.updateCurrentTimeLine(currentTime);
          timeRef.current = currentTime;

          if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
          }

          animationFrameRef.current = requestAnimationFrame(updateCurrentTime);
        };
        updateCurrentTime();
      } else if (type === "stop") {
        soundController.current?.pause(true);
      } else {
        soundController.current?.pause();
      }
    };
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const onVolumeChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const newVolume = Number(event.target.value);
      console.log(newVolume);
      // volRef.current = newVolume;
      setVolume(newVolume);
      soundController.current?.changeVolume(newVolume);
    },
    [volume]
  );

  const handleMouseDown = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback(
    (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      if (isDragging && soundController.current && waveContainerRef.current) {
        console.log("Dragging start:", isDragging);
        soundController.current?.pause();
        const containerRect = waveContainerRef.current.getBoundingClientRect();
        const mouseX = event.clientX - containerRect.left;
        const duration = soundController.current.getDuration();
        if (duration !== undefined) {
          const newTime = (mouseX / containerRect.width) * duration || 0;
          timeRef.current = newTime;

          soundController.current?.rewindTrack(newTime);
        }
      }
    },
    [isDragging]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    soundController.current?.play(timeRef.current);
  }, []);

  useEffect(() => {
    return () => {
      if (soundController.current) {
        soundController.current.pause();
        soundController.current.play();
      }
    };
  }, []);

  return (
    <div style={{ width: "30%" }}>
      {!soundController.current && (
        <div
          className={isDragOver ? "Home drag-over" : "Home"}
          id="dropContainer"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
        >
          {loading ? "Loading..." : "Drop file"}

          <input
            type="file"
            name="sound"
            accept="audio/*"
            style={{ display: "none" }}
          />
        </div>
      )}

      <div
        className="waveContainer"
        id="waveContainer"
        ref={waveContainerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      />

      {!loading && soundController.current && (
        <div id="soundEditor">
          <div className="controllPanel" id="controllPanel">
            <div className="buttons">
              <Button
                onClick={togglePlayer("play")}
                icon={<FontAwesomeIcon icon={faPlayCircle} />}
              />
              <Button
                onClick={togglePlayer("pause")}
                icon={<FontAwesomeIcon icon={faPauseCircle} />}
              />
              <Button
                onClick={togglePlayer("stop")}
                icon={<FontAwesomeIcon icon={faStop} />}
              />
            </div>
            <div className="range">
              <input
                type="range"
                className="customSlider"
                onChange={onVolumeChange}
                value={volume}
                min={-1}
                max={0}
                step={0.01}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;

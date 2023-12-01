import { DragEvent } from "react";
import { useState } from "react";

type Props = {
    file: File[] | undefined;
    setFile: React.Dispatch<React.SetStateAction<any>>;
};

export default function DragDrop(props: Props) {
    const [dragIsOver, setDragIsOver] = useState<boolean>(false);
    // const [files, setFiles] = useState<File[]>([]);

    // Define the event handlers
    const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setDragIsOver(true);
    };

    const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setDragIsOver(false);
    };

    const handleDrop = (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setDragIsOver(false);

        // Fetch the files
        const droppedFiles = Array.from(event.dataTransfer.files);
        props.setFile(droppedFiles);
    };

    return (
        <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "100%",
                width: "100%",
                color: "black",
                border: "1px dotted",
                backgroundColor: dragIsOver ? "lightgray" : "white",
            }}
        >
            Drag and drop some files here
        </div>
    );
}
//code review

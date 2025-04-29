import { Colors, Group, Line, Polygon, Render, Text, Vector3 } from "./src";

function LabeledLine(position: Vector3, labels: string[], length = 1500, labelFontSize = 50) {
    const tickLength = 40;  
    const thickness = 6;

    const object = {
        axis: Line({
            position: [0, 0, 0], 
            length,
            thickness,
        }),
        ticks: [],
        labels: []
    }
    
    const numTicks = labels.length;
    const step = length / (numTicks - 1);
    for (let i = 0; i < numTicks; i++) {
        const x = i * step - length / 2;
        const tickPos: Vector3 = [x, 0, 0];
        const labelPos: Vector3 = [x, labelFontSize + 20, 0];

        object.labels.push(Text({
            string: labels[i], 
            position: labelPos,
            fontSize: labelFontSize
        }));
        object.ticks.push(Line({
            position: tickPos, 
            length: tickLength, 
            angle: 90, 
            thickness: thickness
        }));
    }

    return Group(object).OverridePosition(position);
}

const axis = LabeledLine([0, 100, 0], ["A ", "B", "C"]);
axis.FadeOut();
Render(axis);
import * as d3 from "d3";
import { IOptions } from "./interface";

class Drawer {
  private buffer: AudioBuffer;

  private parent: HTMLElement;

  private currentTimeLine?: any;

  private xScale: d3.ScaleLinear<number, number>;

  private triangle?: any;

  private pausedAt: number = 0;

  constructor(buffer: AudioBuffer, parent: HTMLElement) {
    this.buffer = buffer;
    this.parent = parent;
    this.xScale = d3.scaleLinear();
  }

  public generateWaveform(
    audioData: number[],
    options: IOptions // need to describe interface
  ) {
    const {
      margin = { top: 0, bottom: 0, left: 0, right: 0 },
      height = this.parent.clientHeight,
      width = this.parent.clientWidth,
      padding = 1,
    } = options;

    const domain = d3.extent(audioData);

    const xScale = d3
      .scaleLinear()
      .domain([0, audioData.length - 1])
      .range([margin.left, width - margin.right]);

    const yScale = d3
      .scaleLinear()
      .domain(domain.map((i) => Number(i)))
      .range([margin.top, height - margin.bottom]);

    const svg = d3.create("svg");

    svg
      .style("width", this.parent.clientWidth)
      .style("height", this.parent.clientHeight)
      .style("display", "block")
      .style("border-right", "1.5px solid #cc0000")
      .style("border-left", "1.5px solid #cc0000");

    const g = svg.append("g").attr("transform", `translate(0, ${height / 2})`);

    const band = (width - margin.left - margin.right) / audioData.length;

    g.selectAll("line")
      .data(audioData)
      .join("line")
      .attr("stroke", "#cc0000")
      .attr("height", (d) => yScale(d))
      .attr("width", () => band * padding)
      .attr("x1", (_, i) => xScale(i))
      .attr("y1", (d) => -yScale(d) / 2)
      .attr("x2", (_, i) => xScale(i))
      .attr("y2", (d) => yScale(d) / 2)
      .attr("rx", band / 2)
      .attr("ry", band / 2);

    this.currentTimeLine = g
      .append("line")
      .attr("stroke", "#e4e4e4")
      .attr("stroke-width", 2)
      .attr("x1", xScale(0))
      .attr("y1", -(height / 2))
      .attr("x2", xScale(0))
      .attr("y2", height / 2);

    const triangleSize = 10;
    const triangleHeight = (triangleSize * Math.sqrt(3)) / 2;

    const triangleGroup = g
      .append("g")
      .attr("transform", `translate(0, ${-height / 2 - margin.top})`);

    this.triangle = triangleGroup
      .append("path")
      .attr(
        "d",
        `M${-triangleSize / 2},0 L${triangleSize / 2},0 L0,${triangleHeight} Z`
      )
      .attr("fill", "#e4e4e4")
      .attr("transform", `translate(${xScale(0)},0)`);

    return svg;
  }

  public updateCurrentTimeLine(time: number, duration: number) {
    const currentTimeLine = this.currentTimeLine;
    const triangle = this.triangle;
    if (currentTimeLine && triangle) {
      const xScale = this.xScale;
      currentTimeLine
        .attr("x1", xScale((time / duration) * this.parent.clientWidth))
        .attr("x2", xScale((time / duration) * this.parent.clientWidth));
      triangle.attr(
        "transform",
        `translate(${xScale((time / duration) * this.parent.clientWidth)},0)`
      );
    }
  }

  public clearData() {
    const rawData = this.buffer.getChannelData(0); // We only need to work with one channel of data

    const samples = this.buffer.sampleRate; // Number of samples we want to have in our final data set
    const blockSize = Math.floor(rawData.length / samples); // the number of samples in each subdivision
    const filteredData = [];
    for (let i = 0; i < samples; i += 1) {
      const blockStart = blockSize * i; // the location of the first sample in the block
      let sum = 0;
      for (let j = 0; j < blockSize; j += 1) {
        sum += Math.abs(rawData[blockStart + j]); // find the sum of all the samples in the block
      }
      filteredData.push(sum / blockSize); // divide the sum by the block size to get the average
    }
    const multiplier = Math.max(...filteredData) ** -1;
    return filteredData.map((n) => n * multiplier);
  }

  public init(pausedAt: number = 0) {
    this.pausedAt = pausedAt;
    const audioData = this.clearData();
    const node = this.generateWaveform(audioData, {});
    this.parent.appendChild(node.node() as Element);
  }
}

export default Drawer;

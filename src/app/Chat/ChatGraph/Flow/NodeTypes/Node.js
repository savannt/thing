import styles from "@/app/Chat/ChatGraph/Flow/NodeTypes/NodeTypes.module.css"

import { Handle } from "reactflow"

import FieldValue from "@/app/Chat/ChatGraph/Flow/ValueTypes/FieldValue";
import InputValue from "@/app/Chat/ChatGraph/Flow/ValueTypes/InputValue";
import MasterValue from "../ValueTypes/MasterValue";
import ColorImage from "@/components/ColorImage/ColorImage";

export function NodeGroup ({ data, style }) {
	let {
		displayName,
		name,
		flow = false,

		out
	} = data;

	return (
		<div className={styles.Node__Group} style={style}>
			<div className={styles.Node__Group__Header} style={{
				paddingRight: flow ? `calc(var(--margin-inline) * 0.5)` : "0px"
			}}>
				<p>{displayName || name}</p>
				{ flow && <Handle type="source" position="right" id={`execution-${name}`} /> }
			</div>
			{
				out && Object.entries(out).map(([name, data]) => {
					return <MasterValue data={{ name, ...data, input: false, output: true }} />
				})
			}
		</div>
	)
}

export default function Node ({ color=[200, 200, 200], left = false, right = false, inputExecution = true, outputExecution = true, className, data, children }) {	
	const semiTransparentColor = `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.15)`


	// convert both data.in and data.out to array of objects where key is a name property
	const inValues = data.in ? Object.entries(data.in).map(([name, data]) => ({ name, ...data, input: true, output: false })) : [];
	const outValues = data.out ? Object.entries(data.out).map(([name, data]) => ({ name, ...data, input: false, output: true })) : [];
	
	// combine the two arrays by starting with the first in, then the first out, then the second in, etc
	let values = [];
	for (let i = 0; i < Math.max(inValues.length, outValues.length); i++) {
		if (inValues[i]) values.push(inValues[i]);
		if (outValues[i]) values.push(outValues[i]);
	}
	const hasValues = values.length > 0;
	
		
	const errorValue = data?.errorValue || false;


	const replaceUppercaseChangeWithUnderline = (str) => {
		// when a string has a change in uppercase, i.e. helloWorld -> replace it with "hello_world"
		return str.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
	}

	const doAnimate = data?.animate || false;
	const doAnimateBackwards = data?.animateBackwards || false;

	return (
		<div className={`${styles.Node} ${className} ${data.deleting ? "deleting" : ""} ${data.copying ? "copying" : ""} ${data.error ? "error" : ""} ${doAnimate ? "animate" : ""} ${doAnimateBackwards ? "animateBackwards": ""}`} style={{
			border: `2px solid ${semiTransparentColor}`
		}}>
			<div className={`${styles.Node__Header} ${!left ? "" : styles.Node__Header__NoLeft}`} style={{
				background: semiTransparentColor
			}}>
				{ inputExecution && <Handle type="target" position="left" id="execution" />}
				<h1>{data.displayName || data.name || "error"}</h1>
				<div className={styles.Node__Header__Description} style={{}}>
					<ColorImage className={styles.Node__Header__Dot} image="/images/icons/dot.png" />
					<h2>{data.name ? replaceUppercaseChangeWithUnderline(data.name).toLowerCase() : "no name"}</h2>
				</div>
				{ outputExecution && <Handle type="source" position="right" id="execution" />}
			</div>

			<div className={`${styles.Node__Outputs} ${left ? styles.Node__Outputs__Left : ""} ${right ? styles.Node__Outputs__Right : ""}`}>
				{
					hasValues && values.map((data, i) => {
						const {
							name,
							displayName,
							type,
							description,
							input = false,
							output = false,
							constant = false
						} = data;

						const style = {
							float: "unset",
						};

						// if input, and next value is output, float left
						if(input && values[i + 1] && values[i + 1].output) {
							style.float = "left";
							style.maxWidth = "fit-content";
						}

						// if output and next value is input, float right
						if(output && values[i + 1] && values[i + 1].input) {
							style.float = "right";
							style.maxWidth = "fit-content";
						}


						if(errorValue === name) {
							style.outline = "1.5px solid var(--red)";
							style.outlineOffset = "2px";
							style.borderRadius = "var(--border-radius-light)";
						}

						return <MasterValue data={data} style={style} />
					})
				}
				
				{ children }
			</div>
		 </div>
	)
}
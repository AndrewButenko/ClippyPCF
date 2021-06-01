import { IInputs, IOutputs } from "./generated/ManifestTypes";
import "clippyjs";

export class ClippyPCF implements ComponentFramework.StandardControl<IInputs, IOutputs> {

	private agent: any;

	constructor() {

	}

	public init(context: ComponentFramework.Context<IInputs>,
		notifyOutputChanged: () => void,
		state: ComponentFramework.Dictionary,
		container: HTMLDivElement): void {
		//@ts-ignore
		clippy.load('Clippy', (agent: any) => {
			agent.show();
			agent.moveTo(100, 100);

			this.agent = agent;

			if (!(<any>context.mode).contextInfo.entityId) {
				return;
			}

			agent.play("CheckingSomething");

			const activitiesFetchXml = '' +
				'<fetch version="1.0" output-format="xml-platform" mapping="logical" distinct="true">' +
				'<entity name="activitypointer">' +
				'<attribute name="activityid" />' +
				'<filter type="and">' +
				'<condition attribute="statecode" operator="in">' +
				'<value>0</value>' +
				'<value>3</value>' +
				'</condition>' +
				'<condition attribute="scheduledend" operator="olderthan-x-days" value="1" />' +
				'</filter>' +
				'<link-entity name="activityparty" from="activityid" to="activityid" link-type="inner" alias="ad">' +
				'<filter type="and">' +
				`<condition attribute="partyid" operator="eq" value="${(<any>context.mode).contextInfo.entityId}" />` +
				'</filter>' +
				'</link-entity>' +
				'</entity>' +
				'</fetch>';

			context.webAPI.retrieveMultipleRecords('activitypointer', `?fetchXml=${encodeURIComponent(activitiesFetchXml)}`).then(results => {
				if (results.entities.length === 0) {
					return;
				}

				agent.speak(`This account has ${results.entities.length} activities with passed due date`);
			});
		});
	}


	public updateView(context: ComponentFramework.Context<IInputs>): void {
		const currentFieldValue = (context.parameters.placeholder.formatted ?? "").trim();

		if (currentFieldValue === "") {
			return;
		}

		let accountsQuery = `?$select=accountid&$filter=name eq '${currentFieldValue}'`;
		if ((<any>context.mode).contextInfo.entityId) {
			accountsQuery += ` and  accountid ne ${(<any>context.mode).contextInfo.entityId}`;
		}

		context.webAPI.retrieveMultipleRecords("account", accountsQuery).then(result => {
			if (result.entities.length === 0) {
				return;
			}

			this.agent.play("GetAttention");
			this.agent.speak(`Account with name ${currentFieldValue} already exists in the system`);
		});
	}

	public getOutputs(): IOutputs {
		return {};
	}

	public destroy(): void {
		this.agent.hide();
	}
}

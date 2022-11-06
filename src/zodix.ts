import { json } from 'react-router-dom';
import { z, ZodType } from 'zod';
import type { output, ZodObject, ZodRawShape, ZodTypeAny } from 'zod';

type Options = {
	/** Custom error message for when the validation fails. */
	message?: string;
	/** Status code for thrown request when validation fails. */
	status?: number;
	/** Custom URLSearchParams parsing function. */
	parser?: SearchParamsParser;
};

/**
 * Generic return type for parseX functions.
 */
type ParsedData<T extends ZodRawShape | ZodTypeAny> = T extends ZodTypeAny
	? output<T>
	: T extends ZodRawShape
	? output<ZodObject<T>>
	: never;

/**
 * The data returned from parsing a URLSearchParams object.
 */
type ParsedSearchParams = Record<string, string | string[]>;

/**
 * Function signature to allow for custom URLSearchParams parsing.
 */
type SearchParamsParser = (searchParams: URLSearchParams) => ParsedSearchParams;

const DEFAULT_ERROR_MESSAGE = 'Bad Request';
const DEFAULT_ERROR_STATUS = 400;

export function createErrorResponse(
	options: {
		message?: string;
		status?: number;
	} = {},
): Response {
	const statusText = options?.message || DEFAULT_ERROR_MESSAGE;
	const status = options?.status || DEFAULT_ERROR_STATUS;
	return json(statusText, { status, statusText });
}

/**
 * Parse and validate FormData from a Request. Throws an error if validation fails.
 * @param request - A Request or FormData
 * @param schema - A Zod object shape or object schema to validate.
 * @throws {Response} - Throws an error Response if validation fails.
 */
export async function parseForm<T extends ZodRawShape | ZodTypeAny>(
	request: Request | FormData,
	schema: T,
	options?: Options,
): Promise<ParsedData<T>> {
	try {
		const formData = isFormData(request) ? request : await request.formData();
		const data = await parseSearchParamsDefault(new URLSearchParams(formData as any));
		const finalSchema = schema instanceof ZodType ? schema : z.object(schema);
		return finalSchema.parse(data);
	} catch (error) {
		throw createErrorResponse(options);
	}
}

/**
 * The default parser for URLSearchParams.
 * Get the search params as an object. Create arrays for duplicate keys.
 */
const parseSearchParamsDefault: SearchParamsParser = searchParams => {
	const values: ParsedSearchParams = {};
	for (const [key, value] of searchParams) {
		const currentVal = values[key];
		if (currentVal && Array.isArray(currentVal)) {
			currentVal.push(value);
		} else if (currentVal) {
			values[key] = [currentVal, value];
		} else {
			values[key] = value;
		}
	}
	return values;
};

/**
 * Check if value is an instance of FormData.
 * This is a workaround for `instanceof` to support multiple platforms.
 */
function isFormData(value: unknown): value is FormData {
	return getObjectTypeName(value) === 'FormData';
}

function getObjectTypeName(value: unknown): string {
	return toString.call(value).slice(8, -1);
}

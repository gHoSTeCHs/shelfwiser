import {
    CircleIcon,
    FileIcon,
    InboxIcon,
    SendIcon,
    ShieldAlert,
    TrashIcon,
} from 'lucide-react';
import { useState } from 'react';
import ComponentCard from '../../components/common/ComponentCard';
import PageBreadcrumb from '../../components/common/PageBreadCrumb';
import PageMeta from '../../components/common/PageMeta';
import {
    ActionList,
    ActionListItem,
    HorizontalList,
    HorizontalListItem,
    IconList,
    IconListItem,
    List,
    ListItem,
    SelectableList,
    SelectableListItem,
} from '../../components/ui/list';

export default function Lists() {
    const [selectedItems, setSelectedItems] = useState<number[]>([]);
    const [radioSelection, setRadioSelection] = useState<number | null>(null);

    return (
        <>
            <PageMeta
                title="React.js Lists Dashboard | TailAdmin - React.js Admin Dashboard Template"
                description="This is React.js Lists Dashboard page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
            />
            <PageBreadcrumb pageTitle="Lists" />

            <div className="grid grid-cols-1 gap-5 sm:gap-6 xl:grid-cols-2">
                <div className="space-y-5 sm:space-y-6">
                    <ComponentCard title="Unordered List">
                        <List>
                            <ListItem>Lorem ipsum dolor sit amet</ListItem>
                            <ListItem>
                                It is a long established fact reader
                            </ListItem>
                            <ListItem>Lorem ipsum dolor sit amet</ListItem>
                            <ListItem>Lorem ipsum dolor sit amet</ListItem>
                            <ListItem>Lorem ipsum dolor sit amet</ListItem>
                        </List>
                    </ComponentCard>

                    <ComponentCard title="List With button">
                        <ActionList>
                            <ActionListItem
                                icon={<InboxIcon className="size-5" />}
                                label="Inbox"
                                active
                            />
                            <ActionListItem
                                icon={<SendIcon className="size-5" />}
                                label="Sent"
                            />
                            <ActionListItem
                                icon={<FileIcon className="size-5" />}
                                label="Drafts"
                            />
                            <ActionListItem
                                icon={<TrashIcon className="size-5" />}
                                label="Trash"
                            />
                            <ActionListItem
                                icon={<ShieldAlert className="size-5" />}
                                label="Spam"
                            />
                        </ActionList>
                    </ComponentCard>
                </div>

                <div className="space-y-5 sm:space-y-6">
                    <ComponentCard title="Ordered List">
                        <List ordered>
                            <ListItem>Lorem ipsum dolor sit amet</ListItem>
                            <ListItem>
                                It is a long established fact reader
                            </ListItem>
                            <ListItem>Lorem ipsum dolor sit amet</ListItem>
                            <ListItem>Lorem ipsum dolor sit amet</ListItem>
                            <ListItem>Lorem ipsum dolor sit amet</ListItem>
                        </List>
                    </ComponentCard>

                    <ComponentCard title="List With Icon">
                        <IconList>
                            <IconListItem
                                icon={<CircleIcon className="size-5" />}
                            >
                                Lorem ipsum dolor sit amet
                            </IconListItem>
                            <IconListItem
                                icon={<CircleIcon className="size-5" />}
                            >
                                It is a long established fact reader
                            </IconListItem>
                            <IconListItem
                                icon={<CircleIcon className="size-5" />}
                            >
                                Lorem ipsum dolor sit amet
                            </IconListItem>
                            <IconListItem
                                icon={<CircleIcon className="size-5" />}
                            >
                                Lorem ipsum dolor sit amet
                            </IconListItem>
                            <IconListItem
                                icon={<CircleIcon className="size-5" />}
                            >
                                Lorem ipsum dolor sit amet
                            </IconListItem>
                        </IconList>
                    </ComponentCard>
                </div>

                <ComponentCard title="Horizontal List">
                    <HorizontalList>
                        <HorizontalListItem
                            icon={<CircleIcon className="size-5" />}
                        >
                            Lorem ipsum dolor sit amet
                        </HorizontalListItem>
                        <HorizontalListItem
                            icon={<CircleIcon className="size-5" />}
                        >
                            It is a long established
                        </HorizontalListItem>
                        <HorizontalListItem
                            icon={<CircleIcon className="size-5" />}
                        >
                            Lorem ipsum dolor sit amet
                        </HorizontalListItem>
                        <HorizontalListItem
                            icon={<CircleIcon className="size-5" />}
                        >
                            Lorem ipsum dolor sit amet
                        </HorizontalListItem>
                        <HorizontalListItem
                            icon={<CircleIcon className="size-5" />}
                        >
                            Lorem ipsum dolor sit amet
                        </HorizontalListItem>
                    </HorizontalList>
                </ComponentCard>

                <div className="space-y-5 sm:space-y-6">
                    <ComponentCard title="List with checkbox">
                        <SelectableList>
                            <SelectableListItem
                                type="checkbox"
                                checked={selectedItems.includes(1)}
                                onChange={(checked) =>
                                    setSelectedItems(
                                        checked
                                            ? [...selectedItems, 1]
                                            : selectedItems.filter(
                                                  (id) => id !== 1,
                                              ),
                                    )
                                }
                            >
                                Lorem ipsum dolor sit amet
                            </SelectableListItem>
                            <SelectableListItem
                                type="checkbox"
                                checked={selectedItems.includes(2)}
                                onChange={(checked) =>
                                    setSelectedItems(
                                        checked
                                            ? [...selectedItems, 2]
                                            : selectedItems.filter(
                                                  (id) => id !== 2,
                                              ),
                                    )
                                }
                            >
                                It is a long established fact reader
                            </SelectableListItem>
                            <SelectableListItem
                                type="checkbox"
                                checked={selectedItems.includes(3)}
                                onChange={(checked) =>
                                    setSelectedItems(
                                        checked
                                            ? [...selectedItems, 3]
                                            : selectedItems.filter(
                                                  (id) => id !== 3,
                                              ),
                                    )
                                }
                            >
                                Lorem ipsum dolor sit amet
                            </SelectableListItem>
                            <SelectableListItem
                                type="checkbox"
                                checked={selectedItems.includes(4)}
                                onChange={(checked) =>
                                    setSelectedItems(
                                        checked
                                            ? [...selectedItems, 4]
                                            : selectedItems.filter(
                                                  (id) => id !== 4,
                                              ),
                                    )
                                }
                            >
                                Lorem ipsum dolor sit amet
                            </SelectableListItem>
                            <SelectableListItem
                                type="checkbox"
                                checked={selectedItems.includes(5)}
                                onChange={(checked) =>
                                    setSelectedItems(
                                        checked
                                            ? [...selectedItems, 5]
                                            : selectedItems.filter(
                                                  (id) => id !== 5,
                                              ),
                                    )
                                }
                            >
                                Lorem ipsum dolor sit amet
                            </SelectableListItem>
                        </SelectableList>
                    </ComponentCard>

                    <ComponentCard title="List with radio">
                        <SelectableList>
                            <SelectableListItem
                                type="radio"
                                name="radio-list"
                                checked={radioSelection === 1}
                                onChange={(checked) =>
                                    checked && setRadioSelection(1)
                                }
                            >
                                Lorem ipsum dolor sit amet
                            </SelectableListItem>
                            <SelectableListItem
                                type="radio"
                                name="radio-list"
                                checked={radioSelection === 2}
                                onChange={(checked) =>
                                    checked && setRadioSelection(2)
                                }
                            >
                                It is a long established fact reader
                            </SelectableListItem>
                            <SelectableListItem
                                type="radio"
                                name="radio-list"
                                checked={radioSelection === 3}
                                onChange={(checked) =>
                                    checked && setRadioSelection(3)
                                }
                            >
                                Lorem ipsum dolor sit amet
                            </SelectableListItem>
                            <SelectableListItem
                                type="radio"
                                name="radio-list"
                                checked={radioSelection === 4}
                                onChange={(checked) =>
                                    checked && setRadioSelection(4)
                                }
                            >
                                Lorem ipsum dolor sit amet
                            </SelectableListItem>
                            <SelectableListItem
                                type="radio"
                                name="radio-list"
                                checked={radioSelection === 5}
                                onChange={(checked) =>
                                    checked && setRadioSelection(5)
                                }
                            >
                                Lorem ipsum dolor sit amet
                            </SelectableListItem>
                        </SelectableList>
                    </ComponentCard>
                </div>
            </div>
        </>
    );
}

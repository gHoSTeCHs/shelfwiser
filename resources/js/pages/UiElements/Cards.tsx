import { BoxIcon, UserIcon } from 'lucide-react';
import ComponentCard from '../../components/common/ComponentCard';
import PageBreadcrumb from '../../components/common/PageBreadCrumb';
import PageMeta from '../../components/common/PageMeta';
import Button from '../../components/ui/button/Button';
import {
    Card,
    HorizontalCard,
    IconCard,
    LinkCard,
} from '../../components/ui/card';

export default function Cards() {
    return (
        <>
            <PageMeta
                title="React.js Cards Dashboard | TailAdmin - React.js Admin Dashboard Template"
                description="This is React.js Cards Dashboard page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
            />
            <PageBreadcrumb pageTitle="Cards" />
            <div className="grid grid-cols-1 gap-5 sm:gap-6 xl:grid-cols-2">
                <div className="space-y-5 sm:space-y-6">
                    <ComponentCard title="Basic Card">
                        <Card
                            title="Card Title"
                            description="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus sit amet mi nec massa tincidunt blandit et eu sem."
                            image="/images/cards/card-01.png"
                        >
                            <div className="mt-4">
                                <Button variant="primary" size="sm">
                                    Read More
                                </Button>
                            </div>
                        </Card>
                    </ComponentCard>

                    <ComponentCard title="Horizontal Card">
                        <HorizontalCard
                            title="Card Title"
                            description="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus sit amet mi nec massa tincidunt blandit et eu sem."
                            image="/images/cards/card-02.png"
                        >
                            <div className="mt-4">
                                <Button variant="primary" size="sm">
                                    Learn More
                                </Button>
                            </div>
                        </HorizontalCard>
                    </ComponentCard>
                </div>

                <div className="space-y-5 sm:space-y-6">
                    <ComponentCard title="Link Card">
                        <LinkCard
                            title="Card with Link"
                            description="Lorem ipsum dolor sit amet, consectetur adipiscing elit."
                            link="#"
                            linkText="View Details"
                        />
                    </ComponentCard>

                    <ComponentCard title="Icon Card">
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                            <IconCard
                                icon={<BoxIcon />}
                                title="Products"
                                description="150+ Products"
                            />
                            <IconCard
                                icon={<UserIcon />}
                                title="Customers"
                                description="1.2k+ Active Users"
                            />
                        </div>
                    </ComponentCard>
                </div>
            </div>
        </>
    );
}
